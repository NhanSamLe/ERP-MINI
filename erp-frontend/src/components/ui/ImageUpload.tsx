import { Camera, X } from "lucide-react";
import { useId } from "react";

interface ImageUploadProps {
  preview: string;
  onImageChange: (file: File) => void;
  onRemove: () => void;
  maxSize?: string;
  acceptedFormats?: string;
  multiple?: boolean;
}

export function ImageUpload({
  preview,
  onImageChange,
  onRemove,
  maxSize = "2 MB",
  acceptedFormats = "JPG, PNG",
}: ImageUploadProps) {
  const inputId = useId();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageChange(file);
    }
  };

  return (
    <div className="flex items-start gap-6">
      <div className="relative">
        <img
          src={preview}
          alt="Preview"
          className="w-28 h-28 rounded-lg object-cover border border-gray-200"
        />
        <button
          onClick={onRemove}
          type="button"
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1">
        <label htmlFor={inputId}>
          <div className="inline-flex items-center px-4 py-2 bg-orange-500 text-white text-xs font-medium rounded-md hover:bg-orange-600 cursor-pointer transition-colors">
            <Camera className="w-4 h-4 mr-2" />
            Change Image
          </div>
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-2">
          Upload {acceptedFormats} (max {maxSize})
        </p>
      </div>
    </div>
  );
}
