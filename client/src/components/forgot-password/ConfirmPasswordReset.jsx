import { useEffect, useState } from "react"
import { useSearchParams, useNavigate, Link } from "react-router-dom"
import Button from "@/components/ui/button"
import authService from "@/services/auth.service"
import { useTabCommunication } from "@/utils/tabCommunication"
import { useNotification } from "@/hooks/useNotification"

const ConfirmPasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const tabCommunication = useTabCommunication();
  const { showSuccess, showError } = useNotification();

  const verificationId = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!verificationId || !email) {
      setError("Liên kết xác nhận không hợp lệ");
      return;
    }

    // Kiểm tra xem có tab gốc đã được đăng ký không
    if (tabCommunication.hasPasswordResetTab()) {
      // Có tab gốc, thử redirect về tab đó
      const currentUrl = window.location.href;
      const redirectSuccess = tabCommunication.requestPasswordResetRedirect(currentUrl);
      
      if (redirectSuccess) {
        setIsRedirecting(true);
        // Hiển thị message đang redirect và tự động đóng tab
        return;
      }
    }
    
    // Không có tab gốc hoặc redirect thất bại, tiếp tục hiển thị trang confirm bình thường
  }, [verificationId, email, tabCommunication]);

  const handleConfirmReset = async () => {
    if (!verificationId || !email) {
      setError("Thông tin xác nhận không đầy đủ");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      await authService.confirmPasswordReset(parseInt(verificationId), email);
      
      // Clear any stored password data
      sessionStorage.removeItem('pendingPasswordReset');
      
      showSuccess("Thành công!", "Mật khẩu đã được thay đổi thành công!");
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login', { 
          state: { 
            message: 'Mật khẩu đã được thay đổi thành công! Vui lòng đăng nhập với mật khẩu mới.',
            type: 'success'
          }
        });
      }, 3000);
      
    } catch (err) {
      const errorMsg = err.message || 'Xác nhận thất bại';
      setError(errorMsg);
      showError("Lỗi", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute -top-10 -left-10 w-96 h-96 bg-blue-300 rounded-full blur-2xl opacity-60 animate-float" style={{animation: 'float 8s infinite ease-in-out'}}></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-300 rounded-full blur-2xl opacity-50 animate-float-reverse" style={{animation: 'float-reverse 8s infinite ease-in-out'}}></div>

        {/* Background section */}
        <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
          <div className="text-center text-blue-900 max-w-[640px] p-8">
            <h1 className="text-6xl font-extrabold mb-6 text-blue-700">Đang Chuyển Hướng</h1>
            <p className="text-2xl mb-6 text-blue-600 font-semibold">Vui lòng chờ...</p>
            <p className="text-lg text-blue-500 leading-relaxed">
              Đang chuyển bạn về tab gốc để xác nhận thay đổi mật khẩu. Tab này sẽ tự động đóng ngay khi quá trình hoàn tất.
            </p>
          </div>
        </div>
        
        {/* Redirecting section */}
        <div className="w-full max-w-[600px] flex items-center justify-center relative z-20">
          <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 m-4 border border-blue-100 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-blue-700 mb-2">Đang chuyển hướng...</h1>
              <p className="text-blue-600 font-medium">
                Đang chuyển bạn về tab gốc để xác nhận thay đổi mật khẩu. Tab này sẽ tự động đóng.
              </p>
            </div>
            
            <div className="text-sm text-blue-500 mt-6">
              <p>Nếu tab không tự động đóng, bạn có thể đóng tab này thủ công.</p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-40px) translateX(0px); }
            75% { transform: translateY(-20px) translateX(-10px); }
          }
          
          @keyframes float-reverse {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(20px) translateX(-10px); }
            50% { transform: translateY(40px) translateX(0px); }
            75% { transform: translateY(20px) translateX(10px); }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
        `}</style>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute -top-10 -left-10 w-96 h-96 bg-blue-300 rounded-full blur-2xl opacity-60 animate-float" style={{animation: 'float 8s infinite ease-in-out'}}></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-300 rounded-full blur-2xl opacity-50 animate-float-reverse" style={{animation: 'float-reverse 8s infinite ease-in-out'}}></div>

        {/* Background section */}
        <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
          <div className="text-center text-blue-900 max-w-[640px] p-8">
            <h1 className="text-6xl font-extrabold mb-6 text-blue-700">Thành Công!</h1>
            <p className="text-2xl mb-6 text-blue-600 font-semibold">Mật khẩu đã được cập nhật</p>
            <p className="text-lg text-blue-500 leading-relaxed">
              Mật khẩu của bạn đã được thay đổi thành công. Vui lòng đăng nhập với mật khẩu mới để tiếp tục sử dụng ChatMate.
            </p>
          </div>
        </div>
        
        {/* Success section */}
        <div className="w-full max-w-[600px] flex items-center justify-center relative z-20">
          <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 m-4 border border-blue-100 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-3">Thành công!</h1>
              <p className="text-blue-600 font-medium">
                Mật khẩu của bạn đã được thay đổi thành công. Bạn sẽ được chuyển hướng đến trang đăng nhập sau 3 giây.
              </p>
            </div>
            
            <Link 
              to="/auth/login"
              className="inline-block w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-40px) translateX(0px); }
            75% { transform: translateY(-20px) translateX(-10px); }
          }
          
          @keyframes float-reverse {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(20px) translateX(-10px); }
            50% { transform: translateY(40px) translateX(0px); }
            75% { transform: translateY(20px) translateX(10px); }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute -top-10 -left-10 w-96 h-96 bg-blue-300 rounded-full blur-2xl opacity-60 animate-float" style={{animation: 'float 8s infinite ease-in-out'}}></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-300 rounded-full blur-2xl opacity-50 animate-float-reverse" style={{animation: 'float-reverse 8s infinite ease-in-out'}}></div>
      <div className="absolute top-32 right-1/4 w-72 h-72 bg-blue-200 rounded-full blur-2xl opacity-60 animate-float" style={{animation: 'float 10s infinite ease-in-out'}}></div>

      {/* Background section */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <div className="text-center text-blue-900 max-w-[640px] p-8">
          <h1 className="text-6xl font-extrabold mb-6 text-blue-700">Xác Nhận Thay Đổi</h1>
          <p className="text-2xl mb-6 text-blue-600 font-semibold">Hoàn tất quá trình khôi phục mật khẩu</p>
          <p className="text-lg text-blue-500 leading-relaxed">
            Nhấn nút xác nhận bên dưới để hoàn tất việc thay đổi mật khẩu của bạn. Sau đó bạn sẽ có thể đăng nhập với mật khẩu mới.
          </p>
        </div>
      </div>
      
      {/* Confirmation section */}
      <div className="w-full max-w-[600px] flex items-center justify-center relative z-20">
        <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 m-4 border border-blue-100 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 text-center text-blue-700">Xác nhận thay đổi mật khẩu</h1>
          <p className="text-center text-blue-500 mb-8">Nhấn nút bên dưới để hoàn tất quá trình</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 font-medium">
              {error}
            </div>
          )}

          {!error && verificationId && email && (
            <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg mb-6">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Email:</span> <span className="text-blue-600">{decodeURIComponent(email)}</span>
              </p>
            </div>
          )}

          <Button 
            onClick={handleConfirmReset}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl mb-6"
            disabled={isLoading || error || !verificationId || !email}
          >
            {isLoading ? "Đang xác nhận..." : "Xác nhận thay đổi mật khẩu"}
          </Button>

          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
              Quay lại đăng nhập
            </Link>
            <span className="text-blue-300">|</span>
            <Link to="/auth/forgot-password" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
              Thực hiện lại
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(0px); }
          75% { transform: translateY(-20px) translateX(-10px); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(20px) translateX(-10px); }
          50% { transform: translateY(40px) translateX(0px); }
          75% { transform: translateY(20px) translateX(10px); }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float 8s infinite ease-in-out;
        }

        .animate-float-reverse {
          animation: float-reverse 8s infinite ease-in-out;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

export default ConfirmPasswordReset