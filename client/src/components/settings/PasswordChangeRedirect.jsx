import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTabCommunication } from "@/utils/tabCommunication";

const PasswordChangeRedirect = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("processing"); // processing, redirected, fallback
  const tabCommunication = useTabCommunication();

  const verificationId = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const handleRedirect = async () => {
      if (!verificationId || !email) {
        setStatus("fallback");
        return;
      }

      // Kiểm tra xem có tab gốc không
      if (tabCommunication.hasPasswordResetTab()) {
        // Tạo URL confirm đầy đủ cho password change
        const confirmUrl = `/confirm-password-change?token=${verificationId}&email=${encodeURIComponent(email)}`;
        
        // Thử redirect về tab gốc
        const redirectSuccess = tabCommunication.requestPasswordResetRedirect(confirmUrl);
        
        if (redirectSuccess) {
          setStatus("redirected");
          // Đợi một chút rồi đóng tab
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }
      }

      // Không thể redirect, fallback về trang confirm bình thường
      setStatus("fallback");
      const confirmUrl = `/confirm-password-change?token=${verificationId}&email=${encodeURIComponent(email)}`;
      window.location.href = confirmUrl;
    };

    handleRedirect();
  }, [verificationId, email, tabCommunication]);

  if (status === "processing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Đang xử lý...</h2>
          <p className="text-gray-600">Đang kiểm tra và chuyển hướng bạn đến trang xác nhận đổi mật khẩu.</p>
        </div>
      </div>
    );
  }

  if (status === "redirected") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Đã chuyển hướng thành công!</h2>
          <p className="text-gray-600 mb-4">
            Đã chuyển bạn về tab settings để xác nhận đổi mật khẩu. 
            Tab này sẽ tự động đóng trong vài giây.
          </p>
          <button 
            onClick={() => window.close()} 
            className="text-blue-600 hover:underline text-sm"
          >
            Đóng tab này thủ công
          </button>
        </div>
      </div>
    );
  }

  // Fallback case - should not be visible as we redirect immediately
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Đang chuyển hướng...</h2>
        <p className="text-gray-600">Nếu không tự động chuyển hướng, vui lòng kiểm tra liên kết.</p>
      </div>
    </div>
  );
};

export default PasswordChangeRedirect;