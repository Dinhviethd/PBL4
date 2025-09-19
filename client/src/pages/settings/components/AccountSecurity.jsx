import React, { useState } from "react";
import { ChevronRight, Key, UserX, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import userService from "@/services/user.service";
import useAuthStore from "@/zustand/authStore";
import { useNotification } from "@/hooks/useNotification";

const AccountSecurity = () => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeactivateAccount, setShowDeactivateAccount] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  
  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    deactivatePassword: "",
    deletePassword: ""
  });
  
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const { showSuccess, showError } = useNotification();

  // Validation functions
  const validateCurrentPassword = () => {
    if (!passwordForm.currentPassword) {
      setErrors(prev => ({ ...prev, currentPassword: "Vui lòng nhập mật khẩu hiện tại" }));
      return false;
    }
    setErrors(prev => ({ ...prev, currentPassword: "" }));
    return true;
  };

  const validateNewPassword = () => {
    let isValid = true;
    const newErrors = { ...errors };

    if (!passwordForm.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
      isValid = false;
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
      isValid = false;
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      newErrors.newPassword = "Mật khẩu mới không được giống mật khẩu hiện tại";
      isValid = false;
    } else {
      newErrors.newPassword = "";
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateConfirmPassword = () => {
    if (!passwordForm.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Vui lòng xác nhận mật khẩu mới" }));
      return false;
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Mật khẩu xác nhận không khớp" }));
      return false;
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: "" }));
      return true;
    }
  };

  // Handler functions
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });
    
    // Validate từng bước theo thứ tự
    const isCurrentPasswordValid = validateCurrentPassword();
    if (!isCurrentPasswordValid) return;
    
    const isNewPasswordValid = validateNewPassword();
    if (!isNewPasswordValid) return;
    
    const isConfirmPasswordValid = validateConfirmPassword();
    if (!isConfirmPasswordValid) return;

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      showSuccess("Thành công", "Mật khẩu đã được cập nhật thành công!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({ currentPassword: "", newPassword: "", confirmPassword: "", deactivatePassword: "", deletePassword: "" });
      setShowChangePassword(false);
    } catch (error) {
      console.error("Error changing password:", error);
      const errorMessage = error.response?.data?.message || "Đổi mật khẩu thất bại!";
      
      if (errorMessage.includes("không đúng")) {
        setErrors(prev => ({ ...prev, currentPassword: "Mật khẩu hiện tại không đúng" }));
      } else if (errorMessage.includes("giống")) {
        setErrors(prev => ({ ...prev, newPassword: "Mật khẩu mới không được giống mật khẩu hiện tại" }));
      } else if (errorMessage.includes("ngắn") || errorMessage.includes("length") || errorMessage.includes("lengthen")) {
        setErrors(prev => ({ ...prev, newPassword: "Mật khẩu mới phải có ít nhất 6 ký tự" }));
      } else {
        showError("Lỗi", `Đổi mật khẩu thất bại: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!deactivatePassword) {
      setErrors(prev => ({ ...prev, deactivatePassword: "Vui lòng nhập mật khẩu để xác nhận" }));
      return;
    }

    setLoading(true);
    try {
      await userService.deactivateAccount({ password: deactivatePassword });
      showSuccess("Thành công", "Tài khoản đã được vô hiệu hóa!");
      clearAuth();
      navigate("/auth/login");
    } catch (error) {
      console.error("Error deactivating account:", error);
      const errorMessage = error.response?.data?.message || "Vô hiệu hóa tài khoản thất bại!";
      
      if (errorMessage.includes("không đúng") || errorMessage.includes("Invalid")) {
        setErrors(prev => ({ ...prev, deactivatePassword: "Mật khẩu không đúng" }));
      } else {
        showError("Lỗi", errorMessage);
      }
    } finally {
      setLoading(false);
      setShowDeactivateAccount(false);
      setDeactivatePassword("");
      setErrors(prev => ({ ...prev, deactivatePassword: "" }));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "XÓA TÀI KHOẢN") {
      showError("Lỗi xác nhận", "Vui lòng nhập chính xác 'XÓA TÀI KHOẢN' để xác nhận!");
      return;
    }

    if (!deletePassword) {
      setErrors(prev => ({ ...prev, deletePassword: "Vui lòng nhập mật khẩu để xác nhận" }));
      return;
    }

    setLoading(true);
    try {
      await userService.deleteAccount({ confirmText: deleteConfirmText, password: deletePassword });
      showSuccess("Thành công", "Tài khoản đã được xóa vĩnh viễn!");
      clearAuth();
      navigate("/auth/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage = error.response?.data?.message || "Xóa tài khoản thất bại!";
      
      if (errorMessage.includes("không đúng") || errorMessage.includes("Invalid")) {
        setErrors(prev => ({ ...prev, deletePassword: "Mật khẩu không đúng" }));
      } else {
        showError("Lỗi", errorMessage);
      }
    } finally {
      setLoading(false);
      setShowDeleteAccount(false);
      setDeletePassword("");
      setDeleteConfirmText("");
      setErrors(prev => ({ ...prev, deletePassword: "" }));
    }
  };

  const resetForms = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({ currentPassword: "", newPassword: "", confirmPassword: "", deactivatePassword: "", deletePassword: "" });
    setDeleteConfirmText("");
    setDeactivatePassword("");
    setDeletePassword("");
  };

  // Real-time validation handlers
  const handleCurrentPasswordBlur = () => {
    if (passwordForm.currentPassword) {
      validateCurrentPassword();
    }
  };

  const handleNewPasswordBlur = () => {
    if (passwordForm.newPassword) {
      validateNewPassword();
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (passwordForm.confirmPassword) {
      validateConfirmPassword();
    }
  };

  const securityItems = [
    {
      id: "change-password",
      title: "Đổi mật khẩu",
      description: "Cập nhật mật khẩu để bảo mật tài khoản",
      icon: <Key className="w-5 h-5 text-blue-600" />,
      onClick: () => setShowChangePassword(true)
    },
    {
      id: "deactivate-account", 
      title: "Vô hiệu hóa tài khoản",
      description: "Tạm thời ẩn tài khoản của bạn",
      icon: <UserX className="w-5 h-5 text-orange-600" />,
      onClick: () => setShowDeactivateAccount(true)
    },
    {
      id: "delete-account",
      title: "Xóa tài khoản", 
      description: "Xóa vĩnh viễn tài khoản và tất cả dữ liệu",
      icon: <Trash2 className="w-5 h-5 text-red-600" />,
      onClick: () => setShowDeleteAccount(true)
    }
  ];

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Tài khoản và bảo mật</h2>
        
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {securityItems.map((item) => (
            <div
              key={item.id}
              onClick={item.onClick}
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    onBlur={handleCurrentPasswordBlur}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.currentPassword 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    onBlur={handleNewPasswordBlur}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.newPassword 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                    minLength={6}
                    required
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    onBlur={handleConfirmPasswordBlur}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.confirmPassword 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      resetForms();
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Đang đổi..." : "Đổi mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deactivate Account Modal */}
        {showDeactivateAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Vô hiệu hóa tài khoản</h3>
              <p className="text-gray-600 mb-4">
                Tài khoản của bạn sẽ bị ẩn và bạn có thể kích hoạt lại bất cứ lúc nào bằng cách đăng nhập.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhập mật khẩu của bạn để xác nhận
                </label>
                <input
                  type="password"
                  value={deactivatePassword}
                  onChange={(e) => {
                    setDeactivatePassword(e.target.value);
                    if (errors.deactivatePassword) {
                      setErrors(prev => ({ ...prev, deactivatePassword: "" }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.deactivatePassword 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-orange-500'
                  }`}
                  placeholder="Nhập mật khẩu hiện tại"
                />
                {errors.deactivatePassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.deactivatePassword}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeactivateAccount(false);
                    setDeactivatePassword("");
                    setErrors(prev => ({ ...prev, deactivatePassword: "" }));
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeactivateAccount}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                  disabled={loading || !deactivatePassword}
                >
                  {loading ? "Đang xử lý..." : "Vô hiệu hóa"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Xóa tài khoản</h3>
              <p className="text-gray-600 mb-4">
                <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhập "XÓA TÀI KHOẢN" để xác nhận
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
                  placeholder="XÓA TÀI KHOẢN"
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhập mật khẩu của bạn để xác nhận
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    if (errors.deletePassword) {
                      setErrors(prev => ({ ...prev, deletePassword: "" }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.deletePassword 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-red-500'
                  }`}
                  placeholder="Nhập mật khẩu hiện tại"
                />
                {errors.deletePassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.deletePassword}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteAccount(false);
                    resetForms();
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={loading || deleteConfirmText !== "XÓA TÀI KHOẢN" || !deletePassword}
                >
                  {loading ? "Đang xóa..." : "Xóa tài khoản"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSecurity;