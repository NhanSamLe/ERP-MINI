import { ReactNode } from "react";
interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ type, message, onClose, className = "" }: AlertProps) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-600',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700'
  };

  return (
    <div className={`p-4 border rounded-lg flex items-center justify-between ${styles[type]} ${className}`}>
      <p className="text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current hover:opacity-70 text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}