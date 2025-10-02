import { useState, useEffect } from "react";
import { X, Camera, Briefcase } from "lucide-react"; 
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { updateUserAvatarThunk, updateUserInfoThunk } from "../../features/auth/authSlice";
import { toast } from "react-toastify";

export default function UserProfile() {
  const { user} = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [imagePreview, setImagePreview] = useState(user?.avatar_url ?? 
    `https://ui-avatars.com/api/?name=${user?.full_name}&background=f97316&color=fff&size=200`
  );
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  useEffect(() => {
  if (user?.avatar_url) {
    setImagePreview(user.avatar_url);
  }
  if (user?.full_name) setFullName(user.full_name);
  if (user?.email) setEmail(user.email);
  if (user?.phone) setPhone(user.phone);
}, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      // gọi API update avatar
      const formData = new FormData();
      formData.append("avatar", file);
      dispatch(updateUserAvatarThunk(formData))
      .unwrap()
      .then((data) => {
        console.log("Update avatar success:", data);
        toast.success("Avatar updated successfully!");
      })
      .catch((err) => {
        console.error("Update avatar failed:", err);
        toast.error(err || "Update avatar failed!");
      });
          
    }
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
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-28 h-28 rounded-lg object-cover border border-gray-200"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1">
                  <label htmlFor="image-upload">
                    <div className="inline-flex items-center px-4 py-2 bg-orange-500 text-white text-xs font-medium rounded-md hover:bg-orange-600 cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Image
                    </div>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Upload JPG, PNG (max 2 MB)
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    UserName <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.username}
                    readOnly
                   className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Work Location Section */}
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-4">
                <Briefcase className="w-4 h-4 text-orange-500" />
                Work Location Information
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.branch?.name ?? ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.branch?.code ?? ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Branch Address
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.branch?.address??""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button onClick={handleCancel} className="px-4 py-2 bg-gray-800 text-white text-xs font-medium rounded-md hover:bg-gray-900 transition">
                Cancel
              </button>
              <button  onClick={handleSaveInfo}  className="px-4 py-2 bg-orange-500 text-white text-xs font-medium rounded-md hover:bg-orange-600 transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
