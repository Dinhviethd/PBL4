import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import userService from "@/services/user.service";
import useAuthStore from "@/zustand/authStore";
import { useNotification } from "@/hooks/useNotification";

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();
  const { showSuccess, showError, showWarning } = useNotification();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    gender: "",
    day: "01",
    month: "01",
    year: "2000",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinueStep1 = async (e) => {
    e.preventDefault();
    
    if (!formData.gender.trim()) {
      showWarning("Cảnh báo", "Vui lòng chọn giới tính");
      return;
    }

    const birthdayDate = new Date(
      `${formData.year}-${formData.month.padStart(2, "0")}-${formData.day.padStart(2, "0")}`
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthdayDate > today) {
      showWarning("Cảnh báo", "Ngày sinh không được ở tương lai");
      return;
    }

    setStep(2);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showWarning("Chọn file", "Vui lòng chọn file ảnh!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("File quá lớn", "Vui lòng chọn file nhỏ hơn 5MB.");
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSkipAvatar = async () => {
    try {
      setLoading(true);
      const birthday = `${formData.year}-${formData.month.padStart(2, "0")}-${formData.day.padStart(2, "0")}`;
      const updateData = {      
        gender: formData.gender,
        birthday,
      };

      const updatedUser = await userService.updateProfile(updateData);
      setAuth({
        user: updatedUser,
        accessToken: useAuthStore.getState().accessToken,
      });

      showSuccess("Thành công", "Hoàn tất hồ sơ thành công!");
      navigate("/");
    } catch (err) {
      console.error("Error updating profile:", err);
      const msg = err?.response?.data?.message || "Cập nhật thất bại!";
      showError("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStep2 = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const birthday = `${formData.year}-${formData.month.padStart(2, "0")}-${formData.day.padStart(2, "0")}`;

      const updateData = {
        gender: formData.gender,
        birthday,
      };

      let updatedUser = await userService.updateProfile(updateData);

      // Nếu có avatar, upload avatar
      if (avatarFile) {
        setUploadingAvatar(true);
        updatedUser = await userService.uploadAvatar(avatarFile);
        setUploadingAvatar(false);
      }

      setAuth({
        user: updatedUser,
        accessToken: useAuthStore.getState().accessToken,
      });

      showSuccess("Thành công", "Hoàn tất hồ sơ thành công!");
      navigate("/");
    } catch (err) {
      console.error("Error completing profile:", err);
      const msg = err?.response?.data?.message || "Cập nhật thất bại!";
      showError("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-reverse"></div>
      <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: "2s" }}></div>

      <div className="w-full max-w-2xl relative z-10">
        {step === 1 ? (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-800 mb-3">Hoàn tất hồ sơ</h1>
              <p className="text-xl text-gray-600">Giúp chúng tôi biết thêm về bạn</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white">
              <form onSubmit={handleContinueStep1} className="space-y-8">
                {/* Gender */}
                <div className="space-y-4">
                  <label className="block text-2xl font-bold text-gray-800">
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: "Nam", label: "Nam", icon: "♂" },
                      { value: "Nữ", label: "Nữ", icon: "♀" },
                      { value: "Khác", label: "Khác", icon: "⊚" },
                    ].map((option) => (
                      <label key={option.value} className="cursor-pointer group">
                        <input
                          type="radio"
                          name="gender"
                          value={option.value}
                          checked={formData.gender === option.value}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <div
                          className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 ${
                            formData.gender === option.value
                              ? "border-blue-500 bg-blue-50 shadow-lg transform scale-105"
                              : "border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          <div className="text-5xl mb-2 text-blue-600 font-bold">{option.icon}</div>
                          <div className="text-lg font-semibold text-gray-800">{option.label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Birthday */}
                <div className="space-y-4">
                  <label className="block text-2xl font-bold text-gray-800">
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm text-gray-600 mb-2 block">Ngày</label>
                      <select
                        name="day"
                        value={formData.day}
                        onChange={handleChange}
                        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-lg font-semibold"
                      >
                        {Array.from({ length: 31 }, (_, i) => {
                          const day = String(i + 1).padStart(2, "0");
                          return (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-gray-600 mb-2 block">Tháng</label>
                      <select
                        name="month"
                        value={formData.month}
                        onChange={handleChange}
                        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-lg font-semibold"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = String(i + 1).padStart(2, "0");
                          return (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-gray-600 mb-2 block">Năm</label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-lg font-semibold"
                      >
                        {Array.from({ length: 100 }, (_, i) => {
                          const year = 2025 - i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
                >
                  Tiếp tục →
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-800 mb-3">Thêm ảnh đại diện</h1>
              <p className="text-xl text-gray-600">(Có thể bỏ qua bước này)</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white">
              <form onSubmit={handleSubmitStep2} className="space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <img
                      className="relative w-48 h-48 rounded-full border-4 border-white shadow-2xl object-cover cursor-pointer transition-transform duration-300 group-hover:scale-110"
                      src={
                        avatarPreview ||
                        (user?.avatarUrl
                          ? user.avatarUrl.startsWith("http")
                            ? user.avatarUrl
                            : `${import.meta.env.VITE_API_URL.replace("/api", "")}${user.avatarUrl}`
                          : "/images/avatar-default-icon.png")
                      }
                      alt="avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/avatar-default-icon.png";
                      }}
                      onClick={() => document.getElementById("avatar-upload").click()}
                    />

                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                        <div className="animate-spin border-4 border-white border-t-transparent rounded-full w-10 h-10"></div>
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full cursor-pointer hover:shadow-lg shadow-md transition-all duration-300 transform hover:scale-110"
                      >
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </label>
                    </div>
                  </div>

                  <p className="text-center text-gray-600">
                    Nhấn vào ảnh để thay đổi ảnh đại diện
                  </p>
                </div>

                {avatarFile && (
                  <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                    <p className="text-center text-blue-700 font-semibold">✓ Ảnh mới đã được chọn</p>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all duration-300 flex-1 min-w-[120px]"
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipAvatar}
                    disabled={loading || uploadingAvatar}
                    className="px-8 py-3 bg-gray-400 text-white font-bold rounded-xl hover:bg-gray-500 transition-all duration-300 disabled:opacity-50 flex-1 min-w-[120px]"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingAvatar}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex-1 min-w-[120px]"
                  >
                    {loading || uploadingAvatar ? "Đang xử lý..." : "Hoàn thành ✓"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
