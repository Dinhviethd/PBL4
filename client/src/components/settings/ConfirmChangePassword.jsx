import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import authService from "@/services/auth.service"

const ConfirmChangePassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, [verificationId, email, navigate]);

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
