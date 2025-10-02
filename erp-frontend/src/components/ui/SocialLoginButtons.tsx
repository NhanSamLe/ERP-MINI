interface SocialButton {
  name: string;
  icon: React.ReactNode;
//   onClick: () => void;
}

interface SocialLoginButtonsProps {
  buttons: SocialButton[];
}

export function SocialLoginButtons({ buttons }: SocialLoginButtonsProps) {
  return (
    <>
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-sm text-gray-500">OR</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <div className="flex gap-3">
        {buttons.map((button, index) => (
            <button
            key={index}
            className="flex-1 flex items-center justify-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
            {button.icon}
            </button>
        ))}
        </div>
    </>
  );
}