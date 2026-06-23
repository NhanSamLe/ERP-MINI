import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "@vladmandic/face-api";
import { Camera, X, Check, Loader2 } from "lucide-react";
import { registerFace } from "../service/employee.service";
import { EmployeeDTO } from "../dto/employee.dto";
import { toast } from "react-toastify";

interface RegisterFaceModalProps {
  open: boolean;
  employee: EmployeeDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterFaceModal({
  open,
  employee,
  onClose,
  onSuccess,
}: RegisterFaceModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Đang khởi động camera...");

  // Load models khi mở modal
  useEffect(() => {
    if (!open || !employee) return;

    const loadModels = async () => {
      setStatus("Đang tải mô hình AI nhận diện...");
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setStatus("AI đã sẵn sàng. Vui lòng nhìn thẳng vào camera và nhấn Bắt đầu quét.");
      } catch (err) {
        console.error("Error loading models:", err);
        setStatus("Lỗi tải mô hình AI. Vui lòng kiểm tra thư mục public/models.");
      }
    };

    loadModels();
  }, [open, employee]);

  const handleCapture = async () => {
    if (!webcamRef.current || !employee?.id) return;
    setIsCapturing(true);
    setProgress(30);
    setStatus("Đang phát hiện khuôn mặt...");

    try {
      const video = webcamRef.current.video;
      if (video && video.readyState === 4) {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        setProgress(70);

        if (detection) {
          const faceVector = Array.from(detection.descriptor);
          setStatus("Đang đăng ký vào hệ thống...");
          
          await registerFace(employee.id, faceVector);
          
          setProgress(100);
          setStatus("Đăng ký thành công!");
          toast.success("Đăng ký khuôn mặt thành công!");
          
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          setStatus("Không phát hiện khuôn mặt. Vui lòng nhìn thẳng vào camera.");
          setProgress(0);
          toast.error("Không phát hiện khuôn mặt");
        }
      }
    } catch (error: any) {
      console.error("Lỗi đăng ký khuôn mặt:", error);
      setStatus(`Lỗi: ${error.message || "Không xác định"}`);
      setProgress(0);
      toast.error("Đăng ký thất bại");
    } finally {
      setIsCapturing(false);
    }
  };

  if (!open || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div>
            <h3 className="text-lg font-bold text-white">Đăng ký khuôn mặt AI</h3>
            <p className="text-xs text-slate-400 mt-1">Nhân viên: {employee.full_name} ({employee.emp_code})</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-6">
          {/* Camera Viewport */}
          <div className="relative w-80 h-60 rounded-xl overflow-hidden bg-black border-2 border-blue-500/30 shadow-lg shadow-blue-500/5">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user"
              }}
            />
            
            {/* HUD Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className={`w-48 h-48 rounded-full border-2 border-dashed transition-all duration-300 ${isCapturing ? "border-emerald-500 scale-105" : "border-blue-500/50"}`}></div>
            </div>
            
            {/* Scanlines */}
            {isCapturing && (
              <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-md shadow-emerald-400/50 animate-bounce top-1/2"></div>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Status info */}
          <div className="text-center min-h-[44px]">
            <p className="text-sm font-medium text-slate-200">{status}</p>
            {isCapturing && (
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                Vui lòng giữ nguyên khuôn mặt...
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleCapture}
            disabled={!modelsLoaded || isCapturing}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-sm shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang quét...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Bắt đầu quét
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
