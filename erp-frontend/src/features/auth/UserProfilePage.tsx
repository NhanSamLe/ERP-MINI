import { useState} from "react";
import { Briefcase } from "lucide-react"; 
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { updateUserAvatarThunk, updateUserInfoThunk } from "../../features/auth/authSlice";
import { toast } from "react-toastify";
import { Button } from "../../components/ui/Button";
import { FormInput } from "../../components/ui/FormInput";
import { ImageUpload } from "../../components/ui/ImageUpload";

export default function UserProfile() {
  const { user} = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [imagePreview, setImagePreview] = useState(user?.avatar_url ?? 
    `https://ui-avatars.com/api/?name=${user?.full_name}&background=f97316&color=fff&size=200`
  );
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const handleImageChange = (file: File) => {
  const reader = new FileReader();
  reader.onloadend = () => setImagePreview(reader.result as string);
  reader.readAsDataURL(file);

  const formData = new FormData();
  formData.append("avatar", file);
  dispatch(updateUserAvatarThunk(formData))
    .unwrap()
    .then(() => toast.success("Avatar updated successfully!"))
    .catch((err) => toast.error(err || "Update avatar failed!"));
};

  const handleSaveInfo = () => {
    dispatch(updateUserInfoThunk({ full_name: fullName, email, phone }))
    .unwrap()
    .then(() => toast.success("Profile info updated successfully!"))
    .catch((err) => toast.error(err || "Update info failed!"));
  };


  const handleRemoveImage = () => {
    setImagePreview(
      `https://ui-avatars.com/api/?name=${user?.full_name}&background=f97316&color=fff&size=200`
    );
  };

  const handleCancel = () => {
  if (user) {
    setFullName(user.full_name ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-8xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-800">Profile</h2>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Basic Information Section */}
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-4">
                <span className="text-orange-500">👤</span>
                Basic Information
              </h3>

              {/* Image Upload */}
              <div className="flex items-start gap-6 mb-6">
               <ImageUpload
                  preview={imagePreview}
                  onImageChange={handleImageChange}
                  onRemove={handleRemoveImage}
                />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <FormInput
                  label="User Name"
                  value={user?.username ?? ""}
                  readOnly
                  required
                  className="bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                />

                <FormInput
                  label="Full Name"
                  value={fullName}
                  onChange={setFullName}
                  required
                  className="text-sm"
                />

                <FormInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  required
                  className="text-sm"
                />

                <FormInput
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  required
                  className="text-sm"
                />
              </div>
            </div>

            {/* Work Location Section */}
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-4">
                <Briefcase className="w-4 h-4 text-orange-500" />
                Work Location Information
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <FormInput
                  label="Branch Name"
                  value={user?.branch?.name ?? ""}
                  readOnly
                  className="bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                />

                <FormInput
                  label="Branch Code"
                  value={user?.branch?.code ?? ""}
                  readOnly
                  className="bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                />
              <div className="col-span-2">
                  <FormInput
                    label="Branch Address"
                    value={user?.branch?.address ?? ""}
                    readOnly
                    className="bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveInfo}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
