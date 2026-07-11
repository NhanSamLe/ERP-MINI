import { useState, useEffect, useRef } from "react";
import { Briefcase, User, Key, Mail, Phone, Lock, Save, Globe, Camera, Fingerprint, CheckCircle, AlertTriangle, PenTool } from "lucide-react"; 
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { updateUserAvatarThunk, updateUserInfoThunk, changePasswordThunk, setUser } from "../store";
import { setupSignaturePin, setupSignatureTemplate } from "../auth.service";
import { toast } from "react-toastify";
import { Button } from "../../../components/ui/Button";
import { FormInput } from "../../../components/ui/FormInput";
import { ImageUpload } from "../../../components/ui/ImageUpload";
import { useLocation } from "react-router-dom";

export default function UserProfile() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"info" | "password" | "signature">(
    (location.state as any)?.activeTab || "info"
  );
  const [imagePreview, setImagePreview] = useState(
    user?.avatar_url ?? `https://ui-avatars.com/api/?name=${user?.full_name}&background=f97316&color=fff&size=200`
  );
  
  // Info Form State
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Password Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Signature PIN State
  const [signaturePin, setSignaturePin] = useState("");
  const [confirmSignaturePin, setConfirmSignaturePin] = useState("");
  const [signaturePinPassword, setSignaturePinPassword] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Signature Template State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templatePassword, setTemplatePassword] = useState("");

  const handleSavePin = async () => {
    if (signaturePin.length !== 6 || isNaN(Number(signaturePin))) {
      toast.warning("Mã PIN phải gồm đúng 6 chữ số.");
      return;
    }
    if (signaturePin !== confirmSignaturePin) {
      toast.warning("Mã PIN xác nhận không khớp.");
      return;
    }
    if (user?.signature_pin && !signaturePinPassword.trim()) {
      toast.warning("Vui lòng nhập mật khẩu tài khoản để xác nhận.");
      return;
    }
    setIsSavingPin(true);
    try {
      await setupSignaturePin(signaturePin, user?.signature_pin ? signaturePinPassword : undefined);
      toast.success("Thiết lập mã PIN ký duyệt thành công!");
      if (user) {
        dispatch(setUser({ ...user, signature_pin: "SET" }));
      }
      setSignaturePin("");
      setConfirmSignaturePin("");
      setSignaturePinPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Thiết lập mã PIN thất bại.");
    } finally {
      setIsSavingPin(false);
    }
  };

  // Initialize profile canvas if activeTab is "signature"
  useEffect(() => {
    if (activeTab !== "signature") return;
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = 150 * 2;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `150px`;
      ctx.scale(2, 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1e3a8a"; // Navy blue ink
      ctx.lineWidth = 2.5;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, 150);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveTemplate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureTemplate = canvas.toDataURL("image/png");
    
    if (user?.signature_pin && !templatePassword.trim()) {
      toast.warning("Vui lòng nhập mật khẩu tài khoản để xác nhận.");
      return;
    }
    
    setIsSavingTemplate(true);
    try {
      await setupSignatureTemplate(signatureTemplate, user?.signature_pin ? templatePassword : undefined);
      toast.success("Đăng ký chữ ký mẫu thành công!");
      if (user) {
        dispatch(setUser({ ...user, signature_template: signatureTemplate }));
      }
      setTemplatePassword("");
      clearCanvas();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Đăng ký chữ ký mẫu thất bại.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  useEffect(() => {
    if (user?.avatar_url) {
      setImagePreview(user.avatar_url);
    }
    if (user?.full_name) setFullName(user.full_name);
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  const handleImageChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("avatar", file);
    dispatch(updateUserAvatarThunk(formData))
      .unwrap()
      .then(() => toast.success("Cập nhật ảnh đại diện thành công!"))
      .catch((err) => toast.error(err || "Cập nhật ảnh đại diện thất bại!"));
  };

  const handleSaveInfo = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.warning("Vui lòng điền đầy đủ Tên và Email.");
      return;
    }
    setIsSavingInfo(true);
    try {
      await dispatch(updateUserInfoThunk({ full_name: fullName, email, phone })).unwrap();
      toast.success("Cập nhật thông tin cá nhân thành công!");
    } catch (err: any) {
      toast.error(err || "Cập nhật thông tin thất bại!");
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.warning("Vui lòng điền đầy đủ thông tin mật khẩu.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      toast.warning("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    setIsSavingPassword(true);
    try {
      await dispatch(changePasswordThunk({ oldPassword, newPassword })).unwrap();
      toast.success("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err || "Đổi mật khẩu thất bại!");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(
      `https://ui-avatars.com/api/?name=${user?.full_name}&background=f97316&color=fff&size=200`
    );
  };

  const handleCancelInfo = () => {
    if (user) {
      setFullName(user.full_name ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
    }
  };

  return (
    <div className="page-container max-w-5xl mx-auto py-12 px-6 lg:px-8 space-y-8">
      {/* Upper Profile Banner (Double Bezel) - Orange Brand Highlight (Cam Trắng Theme) */}
      <div className="relative overflow-hidden bg-orange-500/[0.05] dark:bg-orange-500/[0.02] p-2 rounded-[2.5rem] shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-[calc(2.5rem-0.5rem)] p-8 border border-orange-500/20 shadow-[0_15px_35px_rgba(249,115,22,0.15)] text-white text-left">
          
          {/* Ambient light overlay */}
          <div className="absolute inset-0 bg-black/[0.02] backdrop-blur-[0.5px]"></div>
          
          {/* Subtle Orange Glow Ambient Lights */}
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-amber-300/10 blur-[70px] pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-8 z-10">
            {/* Avatar Click-to-Upload Container */}
            <div className="relative shrink-0 group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer group relative block focus:outline-none"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-lg group-hover:border-orange-100 transition duration-300">
                  <img
                    src={imagePreview}
                    alt="Avatar"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300 rounded-full">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = "";
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageChange(file);
                }}
                className="hidden"
              />
            </div>
            
            {/* User Title & Info */}
            <div className="flex-1 text-center md:text-left pt-2 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  {user?.full_name}
                </h1>
                <div className="flex justify-center md:justify-start">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-extrabold bg-white text-orange-600 border border-white/20 shadow-sm">
                    {user?.role?.name || "Thành viên"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Single Panel (Double Bezel) */}
      <div className="bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
        <div className="bg-white dark:bg-slate-900 rounded-[calc(2.5rem-0.5rem)] p-8 border border-slate-200/40 dark:border-slate-800/40 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.02)]">
            {/* Tab Selectors (Pill Slider) */}
            <div className="p-1 bg-slate-100 dark:bg-slate-850 rounded-full flex gap-1 max-w-xl mx-auto mb-8 border border-slate-200/30 dark:border-slate-700/30">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center gap-2 ${
                  activeTab === "info"
                    ? "bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.3)] font-bold"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Thông tin
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center gap-2 ${
                  activeTab === "password"
                    ? "bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.3)] font-bold"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                Mật khẩu
              </button>
              <button
                onClick={() => setActiveTab("signature")}
                className={`flex-1 py-2.5 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center gap-2 ${
                  activeTab === "signature"
                    ? "bg-orange-500 text-white shadow-[0_4px_14px_rgba(249,115,22,0.3)] font-bold"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                PIN Ký duyệt
              </button>
            </div>

            {/* Tab Contents */}
            <div>
              {activeTab === "info" && (
                <div className="space-y-8 animate-fade-in">
                  {/* Basic Information Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-500" />
                      Thông tin tài khoản chính
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput
                        label="Tên đăng nhập"
                        value={user?.username ?? ""}
                        readOnly
                        className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50"
                      />
                      <FormInput
                        label="Họ & Tên hiển thị"
                        value={fullName}
                        onChange={setFullName}
                        required
                        className="text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50 focus:ring-orange-500/20"
                      />
                      <FormInput
                        label="Địa chỉ Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        required
                        className="text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50 focus:ring-orange-500/20"
                      />
                      <FormInput
                        label="Số điện thoại"
                        type="tel"
                        value={phone}
                        onChange={setPhone}
                        required
                        className="text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  {/* Branch Details Section */}
                  {user?.branch && (
                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-orange-500" />
                        Thông tin vị trí & Chi nhánh làm việc
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormInput
                          label="Tên Chi nhánh"
                          value={user.branch.name}
                          readOnly
                          className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50"
                        />
                        <FormInput
                          label="Mã Chi nhánh"
                          value={user.branch.code}
                          readOnly
                          className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50"
                        />
                        <div className="md:col-span-2">
                          <FormInput
                            label="Địa chỉ văn phòng"
                            value={user.branch.address || "Chưa có địa chỉ chi nhánh"}
                            readOnly
                            className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" onClick={handleCancelInfo} disabled={isSavingInfo} className="rounded-full px-6 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                      Hủy bỏ
                    </Button>
                    <Button variant="primary" onClick={handleSaveInfo} loading={isSavingInfo} leftIcon={<Save className="w-4 h-4" />} className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                      Lưu thay đổi
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "password" && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-500" />
                      Cập nhật mật khẩu bảo mật
                    </h3>
                    <div className="space-y-5 max-w-lg">
                      <FormInput
                        label="Mật khẩu hiện tại"
                        type="password"
                        value={oldPassword}
                        onChange={setOldPassword}
                        required
                        className="text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50 focus:ring-orange-500/20"
                        placeholder="••••••••"
                      />
                      <FormInput
                        label="Mật khẩu mới"
                        type="password"
                        value={newPassword}
                        onChange={setNewPassword}
                        required
                        className="text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50 focus:ring-orange-500/20"
                        placeholder="Tối thiểu 6 ký tự"
                      />
                      <FormInput
                        label="Xác nhận mật khẩu mới"
                        type="password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        required
                        className="text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50 focus:ring-orange-500/20"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" onClick={() => { setOldPassword(""); setNewPassword(""); setConfirmPassword(""); }} disabled={isSavingPassword} className="rounded-full px-6 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                      Hủy bỏ
                    </Button>
                    <Button variant="primary" onClick={handleChangePassword} loading={isSavingPassword} leftIcon={<Save className="w-4 h-4" />} className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                      Cập nhật mật khẩu
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "signature" && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-orange-500" />
                      Cài đặt mã PIN ký duyệt điện tử
                    </h3>
                    <p className="text-xs text-slate-500 max-w-lg mb-6">
                      Mã PIN ký duyệt gồm đúng 6 chữ số. Mã PIN này được dùng để ký số xác thực tài liệu PO (Đơn đặt hàng) và AP Invoice (Hóa đơn mua hàng).
                    </p>

                    {user?.signature_pin ? (
                      <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Bạn đã thiết lập mã PIN ký duyệt cho tài khoản này. Bạn vẫn có thể nhập mã PIN mới dưới đây để cập nhật/thay đổi.</span>
                      </div>
                    ) : (
                      <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Tài khoản này chưa thiết lập mã PIN ký duyệt. Vui lòng cài đặt để thực hiện ký số tài liệu PO và Hóa đơn.</span>
                      </div>
                    )}

                    <div className="space-y-5 max-w-lg">
                      {user?.signature_pin && (
                        <FormInput
                          label="Mật khẩu tài khoản xác nhận"
                          type="password"
                          value={signaturePinPassword}
                          onChange={setSignaturePinPassword}
                          required
                          className="text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50 focus:ring-orange-500/20"
                          placeholder="Nhập mật khẩu tài khoản hiện tại"
                        />
                      )}
                      <FormInput
                        label="Mã PIN ký duyệt mới (6 chữ số)"
                        type="password"
                        maxLength={6}
                        value={signaturePin}
                        onChange={setSignaturePin}
                        required
                        className="text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50 focus:ring-orange-500/20 tracking-widest font-mono"
                        placeholder="Nhập 6 chữ số"
                      />
                      <FormInput
                        label="Xác nhận mã PIN ký duyệt mới"
                        type="password"
                        maxLength={6}
                        value={confirmSignaturePin}
                        onChange={setConfirmSignaturePin}
                        required
                        className="text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50 focus:ring-orange-500/20 tracking-widest font-mono"
                        placeholder="Nhập lại 6 chữ số"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" onClick={() => { setSignaturePin(""); setConfirmSignaturePin(""); setSignaturePinPassword(""); }} disabled={isSavingPin} className="rounded-full px-6 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                      Hủy bỏ
                    </Button>
                    <Button variant="primary" onClick={handleSavePin} loading={isSavingPin} leftIcon={<Save className="w-4 h-4" />} className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                      {user?.signature_pin ? "Cập nhật PIN" : "Cài đặt PIN"}
                    </Button>
                  </div>

                  {/* CHỮ KÝ MẪU SECTION */}
                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-orange-500" />
                        Đăng ký Chữ ký mẫu
                      </h3>
                      <p className="text-xs text-slate-500 max-w-lg mb-4">
                        Vẽ chữ ký của bạn vào khung bên dưới để sử dụng nhanh khi duyệt chứng từ (không cần vẽ lại mỗi lần ký).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Drawing Canvas */}
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-500">Khung vẽ chữ ký</label>
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                          <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawingTouch}
                            onTouchMove={drawTouch}
                            onTouchEnd={stopDrawing}
                            className="w-full h-[150px] cursor-crosshair touch-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={clearCanvas}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-650 font-bold rounded-lg text-xs transition duration-200 border border-slate-200/50"
                          >
                            Xóa nét vẽ
                          </button>
                        </div>
                      </div>

                      {/* Current signature template & verification password */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500">Chữ ký mẫu hiện tại</label>
                          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-center min-h-[150px] overflow-hidden">
                            {user?.signature_template ? (
                              <img
                                src={user.signature_template}
                                alt="Chữ ký mẫu"
                                className="max-h-[120px] object-contain border border-dashed border-slate-300 rounded-lg p-1 bg-white"
                              />
                            ) : (
                              <span className="text-xs text-slate-400 italic">Chưa đăng ký chữ ký mẫu</span>
                            )}
                          </div>
                        </div>

                        {user?.signature_pin && (
                          <FormInput
                            label="Mật khẩu tài khoản xác nhận"
                            type="password"
                            value={templatePassword}
                            onChange={setTemplatePassword}
                            required
                            className="text-sm rounded-xl border-slate-200/50 dark:border-slate-700/50 focus:ring-orange-500/20"
                            placeholder="Nhập mật khẩu tài khoản"
                          />
                        )}

                        <div className="flex justify-end pt-2">
                          <Button
                            variant="primary"
                            onClick={handleSaveTemplate}
                            loading={isSavingTemplate}
                            leftIcon={<Save className="w-4 h-4" />}
                            className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300"
                          >
                            Lưu chữ ký mẫu
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
