import { ReactNode } from "react";
interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: ReactNode;
  onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-600',
    error: 'bg-red-50 border-red-200 text-red-600',
    info: 'bg-blue-50 border-blue-200 text-blue-600',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-600'
  };

  return (
    <div className={`p-3 border rounded-lg ${styles[type]} relative`}>
      <p className="text-sm">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-current hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  );
}