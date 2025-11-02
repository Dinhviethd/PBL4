import { useEffect, useState } from "react"
import { useSearchParams, useNavigate, Link } from "react-router-dom"
import Button from "@/components/ui/button"
import authService from "@/services/auth.service"
import { useTabCommunication } from "@/utils/tabCommunication"

const ConfirmPasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const tabCommunication = useTabCommunication();

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
      setError(err.message || 'Xác nhận thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen">
        {/* Background section */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="text-center text-white max-w-[640px] p-8">
            <h1 className="text-5xl font-bold mb-4">ChatMate</h1>
            <p className="text-xl mb-4">Kết nối mọi người, mọi lúc, mọi nơi</p>
            <p className="text-lg">
              Trò chuyện nhanh chóng, chia sẻ khoảnh khắc đáng nhớ và kết nối với bạn bè một cách dễ dàng nhất.
              ChatMate mang đến trải nghiệm nhắn tin hoàn toàn mới.
            </p>
          </div>
        </div>
        
        {/* Redirecting section */}
        <div className="w-full max-w-[600px] flex items-center justify-center bg-gray-100">
          <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl p-10 m-4 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-blue-600 mb-2">Đang chuyển hướng...</h1>
              <p className="text-gray-600">
                Đang chuyển bạn về tab gốc để xác nhận thay đổi mật khẩu. Tab này sẽ tự động đóng.
              </p>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Nếu tab không tự động đóng, bạn có thể đóng tab này thủ công.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen">
        {/* Background section */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="text-center text-white max-w-[640px] p-8">
            <h1 className="text-5xl font-bold mb-4">ChatMate</h1>
            <p className="text-xl mb-4">Kết nối mọi người, mọi lúc, mọi nơi</p>
            <p className="text-lg">
              Trò chuyện nhanh chóng, chia sẻ khoảnh khắc đáng nhớ và kết nối với bạn bè một cách dễ dàng nhất.
              ChatMate mang đến trải nghiệm nhắn tin hoàn toàn mới.
            </p>
          </div>
        </div>
        
        {/* Success section */}
        <div className="w-full max-w-[600px] flex items-center justify-center bg-gray-100">
          <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl p-10 m-4 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">Thành công!</h1>
              <p className="text-gray-600">
                Mật khẩu của bạn đã được thay đổi thành công. Bạn sẽ được chuyển hướng đến trang đăng nhập sau 3 giây.
              </p>
            </div>
            
            <Link 
              to="/auth/login"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Background section */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="text-center text-white max-w-[640px] p-8">
          <h1 className="text-5xl font-bold mb-4">ChatMate</h1>
          <p className="text-xl mb-4">Kết nối mọi người, mọi lúc, mọi nơi</p>
          <p className="text-lg">
            Trò chuyện nhanh chóng, chia sẻ khoảnh khắc đáng nhớ và kết nối với bạn bè một cách dễ dàng nhất.
            ChatMate mang đến trải nghiệm nhắn tin hoàn toàn mới.
          </p>
        </div>
      </div>
      
      {/* Confirmation section */}
      <div className="w-full max-w-[600px] flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl p-10 m-4">
          <h1 className="text-2xl font-bold mb-2">Xác nhận thay đổi mật khẩu</h1>
          <p className="text-gray-600 mb-8">
            Nhấn nút bên dưới để xác nhận và hoàn tất việc thay đổi mật khẩu của bạn.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!error && verificationId && email && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
              <p className="text-sm">
                <strong>Email:</strong> {decodeURIComponent(email)}
              </p>
            </div>
          )}

          <Button 
            onClick={handleConfirmReset}
            className="w-full bg-green-600 hover:bg-green-700 mb-4"
            disabled={isLoading || error || !verificationId || !email}
          >
            {isLoading ? "Đang xác nhận..." : "Xác nhận thay đổi mật khẩu"}
          </Button>

          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            <Link to="/auth/login" className="text-blue-600 hover:underline">
              Quay lại đăng nhập
            </Link>
            <span>|</span>
            <Link to="/auth/forgot-password" className="text-blue-600 hover:underline">
              Thực hiện lại
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmPasswordReset