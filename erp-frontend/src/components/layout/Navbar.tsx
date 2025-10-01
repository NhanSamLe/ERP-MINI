import { ChevronRight, RotateCw, ChevronUp} from "lucide-react";

export default function Navbar() {
  return (
    <div className="h-14 bg-gray-50 border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 hover:text-gray-900 cursor-pointer">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900 font-medium">Overview</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-200 rounded-lg transition">
          <RotateCw className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-200 rounded-lg transition">
          <ChevronUp className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}