import { Link, useNavigate } from 'react-router-dom';
import { Lock, Home, Mail, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
            {/* Header Section with Gradient */}
            <div className="w-full max-w-6xl bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
                
                {/* Cute Robot Animation */}
                <div className="relative z-10 flex items-center justify-center mb-6">
                    <div className="relative">
                        {/* Robot Body */}
                        <svg width="160" height="180" viewBox="0 0 160 180" className="drop-shadow-2xl">
                            {/* Antenna */}
                            <line x1="80" y1="15" x2="80" y2="35" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                            <circle cx="80" cy="12" r="5" fill="#FCD34D" className="animate-pulse"/>
                            
                            {/* Head */}
                            <rect x="50" y="35" width="60" height="50" rx="8" fill="#fff" opacity="0.95"/>
                            <rect x="50" y="35" width="60" height="8" rx="4" fill="#FBBF24"/>
                            
                            {/* Eyes */}
                            <circle cx="65" cy="55" r="8" fill="#EF4444" className="animate-pulse"/>
                            <circle cx="95" cy="55" r="8" fill="#EF4444" className="animate-pulse"/>
                            <circle cx="67" cy="53" r="3" fill="#fff"/>
                            <circle cx="97" cy="53" r="3" fill="#fff"/>
                            
                            {/* Mouth - Sad */}
                            <path d="M 65 70 Q 80 67 95 70" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" fill="none"/>
                            
                            {/* Shield Icon on chest */}
                            <rect x="65" y="100" width="30" height="35" rx="6" fill="#fff" opacity="0.95"/>
                            <path d="M 80 105 L 73 110 L 73 125 Q 73 130 80 133 Q 87 130 87 125 L 87 110 Z" fill="#DC2626"/>
                            <circle cx="80" cy="118" r="3" fill="#fff"/>
                            
                            {/* Body */}
                            <rect x="55" y="90" width="50" height="55" rx="8" fill="#fff" opacity="0.95"/>
                            <rect x="55" y="90" width="50" height="10" rx="4" fill="#FBBF24"/>
                            
                            {/* Arms */}
                            <rect x="30" y="95" width="20" height="40" rx="6" fill="#fff" opacity="0.9"/>
                            <circle cx="40" cy="138" r="8" fill="#FBBF24"/>
                            <rect x="110" y="95" width="20" height="40" rx="6" fill="#fff" opacity="0.9"/>
                            <circle cx="120" cy="138" r="8" fill="#FBBF24"/>
                            
                            {/* Legs */}
                            <rect x="60" y="150" width="15" height="25" rx="4" fill="#fff" opacity="0.9"/>
                            <rect x="85" y="150" width="15" height="25" rx="4" fill="#fff" opacity="0.9"/>
                            <ellipse cx="67.5" cy="175" rx="10" ry="5" fill="#FBBF24"/>
                            <ellipse cx="92.5" cy="175" rx="10" ry="5" fill="#FBBF24"/>
                            
                            {/* Decorative bolts */}
                            <circle cx="45" cy="100" r="3" fill="#94A3B8"/>
                            <circle cx="115" cy="100" r="3" fill="#94A3B8"/>
                            <circle cx="60" cy="130" r="2" fill="#94A3B8"/>
                            <circle cx="100" cy="130" r="2" fill="#94A3B8"/>
                        </svg>
                        
                        {/* Alert badge */}
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-2 animate-bounce">
                            <Lock className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                
                <h1 className="text-4xl font-bold text-center mb-2">
                    401 - Unauthorized
                </h1>
                <p className="text-center text-red-100 text-lg">
                    Truy cập bị từ chối
                </p>
            </div>

            {/* Content Section */}
            <div className="w-full max-w-6xl p-8 md:p-12 bg-white">
                <div className="flex items-start space-x-4 mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <Lock className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Bạn không có quyền truy cập
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Trang này yêu cầu xác thực hoặc bạn không có quyền truy cập vào tài nguyên này. 
                            Vui lòng kiểm tra thông tin đăng nhập của bạn hoặc liên hệ với quản trị viên.
                        </p>
                    </div>
                </div>

                {/* Possible Reasons */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Các nguyên nhân có thể:
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2 mt-1">•</span>
                            <span>Bạn chưa đăng nhập vào hệ thống</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2 mt-1">•</span>
                            <span>Phiên đăng nhập của bạn đã hết hạn</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2 mt-1">•</span>
                            <span>Tài khoản của bạn không có quyền truy cập trang này</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2 mt-1">•</span>
                            <span>Liên kết truy cập không hợp lệ hoặc đã bị thay đổi</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại trang trước</span>
                    </button>
                    <Link 
                        to="/" 
                        className="flex-1 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2 border-2 border-gray-200 hover:border-gray-300"
                    >
                        <Home className="w-5 h-5" />
                        <span>Về trang chủ</span>
                    </Link>
                </div>

                {/* Contact Support */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-2 text-gray-600">
                        <Mail className="w-5 h-5" />
                        <span>Cần hỗ trợ? Liên hệ:</span>
                        <a href="mailto:support@company.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                            erp@company.com
                        </a>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="w-full max-w-4xl text-center mt-6 text-gray-600 text-sm">
                <p>© 2025 ERP System. All rights reserved.</p>
            </div>
        </div>
    );
}