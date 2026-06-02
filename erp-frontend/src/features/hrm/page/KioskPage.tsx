import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "@vladmandic/face-api";
import { Camera, CheckCircle, XCircle, AlertCircle, Volume2, VolumeX, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CheckInResponse {
  success: boolean;
  type: "checkin" | "checkout";
  employee: {
    employeeId: number;
    fullName: string;
    empCode: string;
  };
  time: string;
  status?: string;
  workingHours?: number;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

export default function KioskPage() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Đang khởi động camera...");
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Tải danh sách giọng nói của hệ thống
  useEffect(() => {
    const loadVoices = () => {
      const voiceList = window.speechSynthesis.getVoices();
      setVoices(voiceList);
      console.log("Danh sách giọng nói TTS khả dụng:", voiceList.map(v => `${v.name} (${v.lang})`));
    };

    loadVoices();

    // Chrome cần sự kiện này vì voices được tải bất đồng bộ
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Load models khi mở trang
  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatusMessage("Đang tải mô hình AI...");
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        setStatusMessage("AI sẵn sàng. Hãy đứng trước camera để chấm công.");
      } catch (error) {
        console.error("Lỗi tải mô hình AI:", error);
        setStatusMessage("Lỗi tải mô hình AI. Đảm bảo thư mục public/models có đầy đủ weights.");
      }
    };
    loadModels();
  }, []);

  // Vòng lặp nhận diện khuôn mặt
  useEffect(() => {
    if (!modelsLoaded) return;

    let active = true;
    let timerId: NodeJS.Timeout;

    const detectFace = async () => {
      if (!active) return;

      // Cooldown quét mặt khi hiển thị kết quả hoặc lỗi
      if (checkInResult || errorMessage) {
        timerId = setTimeout(detectFace, 1000);
        return;
      }

      const webcam = webcamRef.current;
      if (webcam && webcam.video && webcam.video.readyState === 4) {
        const video = webcam.video;
        setIsDetecting(true);

        try {
          const detection = await faceapi
            .detectSingleFace(
              video,
              new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
            )
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            setStatusMessage("Đã phát hiện khuôn mặt! Đang đối chiếu...");
            const faceVector = Array.from(detection.descriptor);

            // Gửi dữ liệu bằng fetch thuần để tránh axiosClient interceptors
            const response = await fetch(`${API_BASE_URL}/attendance/check-in-ai`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ faceVector })
            });

            const data = await response.json();

            if (response.ok && data.success) {
              setCheckInResult(data);
              speak(data.message);

              setTimeout(() => {
                setCheckInResult(null);
                setStatusMessage("Sẵn sàng. Hãy nhìn thẳng vào camera.");
              }, 4000);
            } else {
              setErrorMessage(data.error || "Nhận diện thất bại");
              speak("Không nhận diện được khuôn mặt");

              setTimeout(() => {
                setErrorMessage(null);
                setStatusMessage("Sẵn sàng. Hãy nhìn thẳng vào camera.");
              }, 2500);
            }
          } else {
            setStatusMessage("Đang quét... Hãy đứng đối diện camera.");
          }
        } catch (err) {
          console.error("Lỗi quét khuôn mặt:", err);
        }
        setIsDetecting(false);
      }

      timerId = setTimeout(detectFace, 800);
    };

    detectFace();

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, [modelsLoaded, checkInResult, errorMessage]);

  // TTS giọng nói
  const speak = (text: string) => {
    if (!voiceEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";

      // Lấy danh sách giọng nói hiện tại, nếu rỗng thì dùng danh sách đã lưu ở state
      let activeVoices = window.speechSynthesis.getVoices();
      if (activeVoices.length === 0) {
        activeVoices = voices;
      }

      const viVoice = activeVoices.find(voice => {
        const lang = voice.lang.toLowerCase();
        const name = voice.name.toLowerCase();
        return (
          lang === "vi-vn" ||
          lang.startsWith("vi-") ||
          lang.startsWith("vi_") ||
          lang === "vi" ||
          name.includes("vietnam") ||
          name.includes("tiếng việt") ||
          name.includes("vi-vn")
        );
      });

      if (viVoice) {
        utterance.voice = viVoice;
        console.log(`[TTS] Đã chọn giọng tiếng Việt: ${viVoice.name} (${viVoice.lang})`);
      } else {
        console.warn("[TTS] Không tìm thấy giọng tiếng Việt trong hệ thống, sử dụng giọng mặc định.");
      }

      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Trình duyệt không hỗ trợ giọng nói tiếng Việt", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">

      {/* Header */}
      <header className="px-8 py-4 border-b border-slate-900 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="logo flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">AI</div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">ERP KIOSK</span>
          </div>
        </div>

        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-800 rounded-xl hover:bg-slate-800 text-sm font-semibold text-slate-300 transition-all duration-200"
        >
          {voiceEnabled ? <Volume2 className="w-4.5 h-4.5 text-blue-400" /> : <VolumeX className="w-4.5 h-4.5 text-rose-400" />}
          {voiceEnabled ? "Âm thanh: Bật" : "Âm thanh: Tắt"}
        </button>
      </header>

      {/* Main layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Camera Frame Column */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-[4/3] max-w-lg rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black shadow-slate-950">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover scale-x-[-1]" // Lật đối xứng gương cho tự nhiên
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user"
                }}
              />

              {/* Scan Overlay Overlay HUD */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className={`w-56 h-56 md:w-64 md:h-64 rounded-full border-2 border-dashed transition-all duration-500 ${isDetecting ? "border-emerald-400 scale-[1.03] shadow-[0_0_25px_rgba(52,211,153,0.15)]" : "border-blue-500/30"}`}>
                  {/* Rotating scanner rings */}
                  <div className="w-full h-full rounded-full border border-blue-500/10 animate-spin duration-1000"></div>
                </div>
              </div>

              {/* Bouncing Scanning beam line */}
              {isDetecting && (
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)] top-0 animate-[scan_3s_linear_infinite]"></div>
              )}

              {/* Status Dot */}
              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800/80 text-xs font-semibold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${modelsLoaded ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-spin"}`}></span>
                <span className="text-slate-300">{modelsLoaded ? "Detection" : "ĐANG KHỞI TẠO AI..."}</span>
              </div>
            </div>
          </div>

          {/* Result details info column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 md:p-8 backdrop-blur-md flex flex-col justify-center min-h-[320px]">

              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Trạng thái thiết bị</h3>
                <p className="text-base font-medium text-slate-300 mt-1 italic">"{statusMessage}"</p>
              </div>

              {/* Success Result view */}
              {checkInResult && (
                <div className={`p-6 rounded-xl border flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-300 ${checkInResult.type === "checkin" ? "bg-emerald-950/20 border-emerald-500/30" : "bg-blue-950/20 border-blue-500/30"}`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white mb-4 ${checkInResult.type === "checkin" ? "bg-emerald-500" : "bg-blue-500"}`}>
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    {checkInResult.type === "checkin" ? "Check-in thành công!" : "Check-out thành công!"}
                  </h4>
                  <p className="text-xl font-extrabold text-white mt-2">
                    {checkInResult.employee.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Mã nhân viên: {checkInResult.employee.empCode}</p>

                  <div className="flex gap-4 items-center justify-center mt-4 text-sm text-slate-300 bg-slate-950/50 px-4 py-2 rounded-lg border border-slate-800">
                    <div>Giờ: <strong>{checkInResult.time}</strong></div>
                    {checkInResult.workingHours !== undefined && (
                      <div className="border-l border-slate-800 pl-4">Ca: <strong>{checkInResult.workingHours}h</strong></div>
                    )}
                  </div>

                  {checkInResult.status === "late" && (
                    <span className="mt-3.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase rounded-full">
                      Đi muộn
                    </span>
                  )}
                </div>
              )}

              {/* Error Result view */}
              {errorMessage && (
                <div className="p-6 rounded-xl border bg-rose-950/20 border-rose-500/30 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="w-14 h-14 rounded-full bg-rose-500 flex items-center justify-center text-white mb-4">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-rose-400">Nhận Diện Thất Bại</h4>
                  <p className="text-sm text-slate-200 mt-2">{errorMessage}</p>
                  <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-400">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Đảm bảo khuôn mặt nằm trong vòng tròn</span>
                  </div>
                </div>
              )}

              {/* Idle state */}
              {!checkInResult && !errorMessage && (
                <div className="flex flex-col items-center justify-center text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/10">
                  <Camera className="w-12 h-12 text-slate-700 animate-pulse" />
                  <p className="text-sm text-slate-500 mt-4 max-w-[240px]">
                    Kiosk đang chạy tự động. Nhìn vào camera để điểm danh ra/vào ca.
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* Embedded CSS scanline animation */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
