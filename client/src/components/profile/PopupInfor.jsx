import React, { useState, useEffect, useMemo } from "react";
import userService from "@/services/user.service";
import useAuthStore from "@/zustand/authStore";
import { useNotification } from "@/hooks/useNotification";

export default function ProfilePopup({ isOpen, onClose }) {
  const { user, setAuth } = useAuthStore();
  const { showSuccess, showError, showWarning } = useNotification();

  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Helper để đồng bộ formData với user
  const setFormDataFromUser = (userData) => {
    let day = "01", month = "01", year = "2000";
    if (userData.birthday) {
      const parts = userData.birthday.split("-");
      if (parts.length === 3) {
        year = parts[0];
        month = parts[1];
        day = parts[2].slice(0, 2);
      }
    }
    setFormData({
      name: userData.name || "",
      gender: userData.gender || "",
      day,
      month,
      year,
      phone: userData.phone || "",
    });
  };

  // Khi popup mở -> load thông tin user
  useEffect(() => {
    if (isOpen && (!user || !user.name)) {
      setLoading(true);
      userService.getProfile()
        .then((userData) => {
          setAuth({
            user: userData,
            accessToken: useAuthStore.getState().accessToken
          });
          setFormDataFromUser(userData);
        })
        .catch((err) => {
          console.error("Error loading profile:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!isOpen) {
      setIsEdit(false);
    }
  }, [isOpen, user, setAuth]);

  // Đồng bộ form với user khi mở
  useEffect(() => {
    if (user && user.name && isOpen) {
      setFormDataFromUser(user);
    }
  }, [user, isOpen]);

  // Form ban đầu để so sánh khi chỉnh sửa
  const initialForm = useMemo(() => {
    if (!user) return formData;
    let day = "01", month = "01", year = "2000";
    if (user.birthday) {
      const parts = user.birthday.split("-");
      if (parts.length === 3) {
        year = parts[0];
        month = parts[1];
        day = parts[2].slice(0, 2);
      }
    }
    return {
      name: user.name || "",
      gender: user.gender || "",
      day,
      month,
      year,
      phone: user.phone || "",
    };
  }, [user, formData]);

  const isChanged = useMemo(() => {
    return Object.keys(initialForm).some(key => formData[key] !== initialForm[key]);
  }, [formData, initialForm]);

  if (!isOpen) return null;

  if (loading && !user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8">Đang tải thông tin...</div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateClick = () => setIsEdit(true);

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

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      setUploadingAvatar(true);
      const updatedUser = await userService.uploadAvatar(avatarFile);

      setAuth({
        user: updatedUser,
        accessToken: useAuthStore.getState().accessToken
      });

      setAvatarFile(null);
      setAvatarPreview(null);
      showSuccess("Thành công", "Cập nhật avatar thành công!");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      const msg = err?.response?.data?.message || "Cập nhật avatar thất bại!";
      showError("Lỗi", msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelAvatarUpload = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ngày sinh không được ở tương lai
    const birthdayDate = new Date(`${formData.year}-${formData.month.padStart(2, "0")}-${formData.day.padStart(2, "0")}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (birthdayDate > today) {
      showWarning("Cảnh báo", "Ngày sinh không được ở tương lai");
      return;
    }
    
    const birthday = `${formData.year}-${formData.month.padStart(2, "0")}-${formData.day.padStart(2, "0")}`;
    const updateData = {
      name: formData.name,
      gender: formData.gender,
      birthday,
      phone: formData.phone,
    };
    try {
      const updatedUser = await userService.updateProfile(updateData);
      setAuth({
        user: updatedUser,
        accessToken: useAuthStore.getState().accessToken
      });
      setFormDataFromUser(updatedUser);
      setIsEdit(false);
      showSuccess("Thành công", "Cập nhật thông tin thành công!");
    } catch (err) {
      console.error("Error updating profile:", err);
      showError("Lỗi", "Cập nhật thất bại!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors"
          onClick={onClose}
        >
          ✖
        </button>

        {!isEdit ? (
          <>
            {/* Banner */}
            <div className="h-36 bg-gray-200 rounded-2xl -mx-8 -mt-8 overflow-hidden">
              <img src="https://picsum.photos/800/300" alt="cover" className="h-full w-full object-cover" />
            </div>

            {/* Avatar */}
            <div className="flex justify-center -mt-20 mb-4 relative">
              <div className="relative">
                <img
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
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
                />

                {/* Loading overlay khi upload */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                    <div className="animate-spin border-4 border-white border-t-transparent rounded-full w-8 h-8"></div>
                  </div>
                )}

                {/* Nút upload */}
                <div className="absolute bottom-0 right-0">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" id="avatar-upload" />
                  <label
                    htmlFor="avatar-upload"
                    className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0z" />
                    </svg>
                  </label>
                </div>
              </div>
            </div>

            {/* Avatar controls */}
            {avatarFile && (
              <div className="text-center mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Ảnh mới đã được chọn</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleUploadAvatar}
                    disabled={uploadingAvatar}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {uploadingAvatar ? "Đang tải..." : "Cập nhật"}
                  </button>
                  <button
                    onClick={handleCancelAvatarUpload}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Thông tin người dùng */}
            <div className="text-center mt-4">
              <h2 className="font-bold text-3xl text-gray-800">{user?.name || "Người dùng"}</h2>
              <div className="flex flex-col items-center mt-6 space-y-4">
                <p className="text-lg text-gray-700"><span className="font-semibold">Email:</span> {user?.email || ""}</p>
                <p className="text-lg text-gray-700"><span className="font-semibold">Giới tính:</span> {user?.gender || ""}</p>
                <p className="text-lg text-gray-700"><span className="font-semibold">Ngày sinh:</span> {user?.birthday ? `${user.birthday.split("-")[2]}/${user.birthday.split("-")[1]}/${user.birthday.split("-")[0]}` : ""}</p>
                {user?.phone && <p className="text-lg text-gray-700"><span className="font-semibold">Điện thoại:</span> {user.phone}</p>}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                onClick={handleUpdateClick}
              >
                Cập nhật hồ sơ
              </button>
            </div>
          </>
        ) : (
          // Form chỉnh sửa
          <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Cập nhật thông tin cá nhân</h2>

            <label className="block text-gray-700 font-medium mb-1">Tên hiển thị</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="block text-gray-700 font-medium mb-1">Giới tính</label>
            <div className="flex items-center mb-4 space-x-4">
              <label><input type="radio" name="gender" value="Nam" checked={formData.gender === "Nam"} onChange={handleChange} className="mr-1" />Nam</label>
              <label><input type="radio" name="gender" value="Nữ" checked={formData.gender === "Nữ"} onChange={handleChange} className="mr-1" />Nữ</label>
              <label><input type="radio" name="gender" value="Khác" checked={formData.gender === "Khác"} onChange={handleChange} className="mr-1" />Khác</label>
            </div>

            <label className="block text-gray-700 font-medium mb-1">Ngày sinh</label>
            <div className="flex space-x-2 mb-4">
              <select name="day" value={formData.day} onChange={handleChange} className="p-2 border rounded-lg flex-1">
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i+1} value={String(i+1).padStart(2, "0")}>{String(i+1).padStart(2,"0")}</option>
                ))}
              </select>
              <select name="month" value={formData.month} onChange={handleChange} className="p-2 border rounded-lg flex-1">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={String(i+1).padStart(2, "0")}>{String(i+1).padStart(2,"0")}</option>
                ))}
              </select>
              <select name="year" value={formData.year} onChange={handleChange} className="p-2 border rounded-lg flex-1">
                {Array.from({ length: 100 }, (_, i) => {
                  const year = 2025 - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>

            <div className="flex justify-between mt-6">
              <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300" onClick={() => setIsEdit(false)}>Hủy</button>
              <button type="submit" className={`px-6 py-2 rounded-lg text-white ${isChanged ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`} disabled={!isChanged}>
                Cập nhật
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
