import React from "react";

export default function ProfilePopup({ isOpen, onClose, avatar, name, gender, dob, phone }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-4 relative">
        {/* Nút đóng */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ✖
        </button>

        {/* Ảnh bìa */}
        <div className="h-24 bg-gray-200 rounded-t-lg overflow-hidden">
          <img
            className="h-full w-full object-cover"
            src="https://picsum.photos/600/200"
            alt="cover"
          />
        </div>

        {/* Ảnh đại diện */}
        <div className="flex justify-center -mt-10">
          <img
            className="w-20 h-20 rounded-full border-4 border-white"
            src={avatar}
            alt="avatar"
          />
        </div>

        {/* Thông tin */}
        <div className="text-center mt-2">
          <h2 className="font-semibold text-lg">{name}</h2>
          <p className="text-gray-600">Giới tính: {gender}</p>
          <p className="text-gray-600">Ngày sinh: {dob}</p>
          <p className="text-gray-600">Điện thoại: {phone}</p>
        </div>

        {/* Nút cập nhật */}
        <div className="mt-4 text-center">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}
