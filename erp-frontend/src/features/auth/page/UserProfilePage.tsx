import { useState, useEffect, useRef } from "react";
import { Briefcase, User, Key, Mail, Phone, Lock, Save, Globe, Camera, Fingerprint, CheckCircle, AlertTriangle } from "lucide-react"; 
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { updateUserAvatarThunk, updateUserInfoThunk, changePasswordThunk, setUser } from "../store";
import { setupSignaturePin } from "../auth.service";
import { toast } from "react-toastify";
import { Button } from "../../../components/ui/Button";
import { FormInput } from "../../../components/ui/FormInput";
import { ImageUpload } from "../../../components/ui/ImageUpload";

export default function UserProfile() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"info" | "password" | "signature">("info");
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
  const [isSavingPin, setIsSavingPin] = useState(false);

  const handleSavePin = async () => {
    if (signaturePin.length !== 6 || isNaN(Number(signaturePin))) {
      toast.warning("Mã PIN phải gồm đúng 6 chữ số.");
      return;
    }
    if (signaturePin !== confirmSignaturePin) {
      toast.warning("Mã PIN xác nhận không khớp.");
      return;
    }
    setIsSavingPin(true);
    try {
      await setupSignaturePin(signaturePin);
      toast.success("Thiết lập mã PIN ký duyệt thành công!");
      if (user) {
        dispatch(setUser({ ...user, signature_pin: "SET" }));
      }
      setSignaturePin("");
      setConfirmSignaturePin("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Thiết lập mã PIN thất bại.");
    } finally {
      setIsSavingPin(false);
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
                    <Button variant="outline" onClick={() => { setSignaturePin(""); setConfirmSignaturePin(""); }} disabled={isSavingPin} className="rounded-full px-6 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                      Hủy bỏ
                    </Button>
                    <Button variant="primary" onClick={handleSavePin} loading={isSavingPin} leftIcon={<Save className="w-4 h-4" />} className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                      {user?.signature_pin ? "Cập nhật PIN" : "Cài đặt PIN"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
