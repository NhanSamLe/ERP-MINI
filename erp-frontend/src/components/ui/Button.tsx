
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success'| 'warning';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const baseStyles = `rounded-lg font-semibold transition duration-200 
                      disabled:opacity-50 disabled:cursor-not-allowed`;

  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-900 text-white',
    outline: 'border border-gray-300 hover:bg-gray-100 text-gray-800',
    ghost: 'text-orange-500 hover:text-orange-600',
    success: "bg-green-600 hover:bg-green-700 text-white",
    warning: " bg-red-600 hover:bg-red-700 text-white"
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${sizes[size]}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
