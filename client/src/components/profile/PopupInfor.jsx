import React, { useState, useEffect, useMemo } from "react";
import userService from "@/services/user.service";

export default function ProfilePopup({ isOpen, onClose, avatar, name, gender, dob, phone }) {
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    day: "01",
    month: "01",
    year: "2000",
    phone: "",
  });

  // Load user profile khi mở popup
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      userService.getProfile().then((res) => {
        const u = res.data || res;
        setUser(u);

        let day = "01", month = "01", year = "2000";
        if (u.birthday) {
          const parts = u.birthday.split("-");
          if (parts.length === 3) {
            year = parts[0];
            month = parts[1];
            day = parts[2].slice(0, 2);
          }
        }

        setFormData({
          name: u.name || "",
          gender: u.gender || "",
          day,
          month,
          year,
          phone: u.phone || "",
        });

        setLoading(false);
      });
    } else {
      // Reset edit mode khi đóng popup
      setIsEdit(false);
    }
  }, [isOpen]);

  // Tạo form ban đầu để so sánh
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
  }, [user]);

  // Kiểm tra form đã thay đổi chưa
  const isChanged = useMemo(() => {
    return Object.keys(initialForm).some(key => formData[key] !== initialForm[key]);
  }, [formData, initialForm]);

  if (!isOpen) return null;

  if (loading) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const birthday = `${formData.year}-${formData.month.padStart(2, "0")}-${formData.day.padStart(2, "0")}`;
    const updateData = {
      name: formData.name,
      gender: formData.gender,
      birthday,
      phone: formData.phone,
    };
    try {
      await userService.updateProfile(updateData);
      setUser(updateData); // cập nhật ngay
      setIsEdit(false);
      // onClose(); // nếu muốn đóng popup sau khi cập nhật, bỏ comment dòng này
    } catch (err) {
      console.error(err);
      alert("Cập nhật thất bại!");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative transform scale-95 transition-all duration-300 ease-out hover:scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors duration-200"
          onClick={onClose}
        >
          ✖
        </button>

        {!isEdit ? (
          // Chế độ xem
          <>
            <div className="h-36 bg-gray-200 rounded-2xl -mx-8 -mt-8 overflow-hidden">
              <img
                className="h-full w-full object-cover"
                src="https://picsum.photos/800/300"
                alt="cover"
              />
            </div>

            <div className="flex justify-center -mt-20 mb-4">
              <img
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                src={user?.avatarUrl || avatar}
                alt="avatar"
              />
            </div>

            <div className="text-center mt-4">
              <h2 className="font-bold text-3xl text-gray-800">{user?.name || name}</h2>
              <div className="flex flex-col items-center mt-6 space-y-4">
                <p className="text-lg text-gray-700"><span className="font-semibold">Giới tính:</span> {user?.gender || gender}</p>
                <p className="text-lg text-gray-700"><span className="font-semibold">Ngày sinh:</span> {user?.birthday ? `${user.birthday.split("-")[2]}/${user.birthday.split("-")[1]}/${user.birthday.split("-")[0]}` : dob}</p>
                <p className="text-lg text-gray-700"><span className="font-semibold">Điện thoại:</span> {user?.phone || phone}</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                onClick={handleUpdateClick}
              >
                Cập nhật hồ sơ
              </button>
            </div>
          </>
        ) : (
          // Chế độ chỉnh sửa
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
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Nam"
                  checked={formData.gender === "Nam"}
                  onChange={handleChange}
                  className="mr-1"
                />
                Nam
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Nữ"
                  checked={formData.gender === "Nữ"}
                  onChange={handleChange}
                  className="mr-1"
                />
                Nữ
              </label>
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
              <button
                type="button"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                onClick={() => setIsEdit(false)}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`px-6 py-2 rounded-lg text-white ${isChanged ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
                disabled={!isChanged}
              >
                Cập nhật
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
