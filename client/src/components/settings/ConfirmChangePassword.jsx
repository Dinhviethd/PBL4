import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import authService from "@/services/auth.service"
import { useTabCommunication } from "@/utils/tabCommunication"

const ConfirmChangePassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const tabCommunication = useTabCommunication();

  const verificationId = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const handleAutoConfirm = async () => {
      if (!verificationId || !email) {
        navigate('/settings', { 
          state: { 
            message: 'Liên kết xác nhận không hợp lệ',
            type: 'error'
          }
        });
        return;
      }

      // Kiểm tra xem có tab gốc đã được đăng ký không
      if (tabCommunication.hasPasswordResetTab()) {
        // Có tab gốc, thử redirect về tab đó
        const currentUrl = window.location.href;
        const redirectSuccess = tabCommunication.requestPasswordResetRedirect(currentUrl);
        
        if (redirectSuccess) {
          setIsRedirecting(true);
          setIsLoading(false);
          // Hiển thị message đang redirect và tự động đóng tab
          return;
        }
      }

      try {
        setIsLoading(true);
        
        await authService.confirmChangePassword(parseInt(verificationId), email);
        
        // Redirect to settings with success message
        navigate('/settings', { 
          state: { 
            message: 'Mật khẩu đã được thay đổi thành công!',
            type: 'success'
          }
        });
        
      } catch (err) {
        console.error('Error confirming password change:', err);
        navigate('/settings', { 
          state: { 
            message: err.message || 'Xác nhận thay đổi mật khẩu thất bại',
            type: 'error'
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleAutoConfirm();
  }, [verificationId, email, navigate, tabCommunication]);

  // Redirecting screen
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-blue-600 mb-2">Đang chuyển hướng...</h1>
            <p className="text-gray-600">
              Đang chuyển bạn về tab settings để xác nhận đổi mật khẩu. Tab này sẽ tự động đóng.
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Nếu tab không tự động đóng, bạn có thể đóng tab này thủ công.</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen while processing
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Đang xác nhận...</h1>
          <p className="text-gray-600">
            Vui lòng chờ trong giây lát, chúng tôi đang xác nhận thay đổi mật khẩu của bạn.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfirmChangePassword
