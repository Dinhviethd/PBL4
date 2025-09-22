import React, { useState } from "react";
import { Monitor, Moon, Sun, Palette, Type, Layout } from "lucide-react";

const Appearance = () => {
  const [settings, setSettings] = useState({
    theme: "light", // light, dark, system
    accentColor: "blue",
    fontSize: "medium", // small, medium, large
    compactMode: false,
    showAvatars: true,
    showOnlineStatus: true,
    messageBubbleStyle: "rounded", // rounded, square
    sidebarPosition: "left" // left, right
  });

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const themes = [
    { id: "light", name: "Sáng", icon: <Sun className="w-4 h-4" />, bg: "bg-white", border: "border-gray-200" },
    { id: "dark", name: "Tối", icon: <Moon className="w-4 h-4" />, bg: "bg-gray-900", border: "border-gray-700" },
    { id: "system", name: "Theo hệ thống", icon: <Monitor className="w-4 h-4" />, bg: "bg-gradient-to-br from-white to-gray-900", border: "border-gray-400" }
  ];

  const accentColors = [
    { id: "blue", name: "Xanh dương", color: "bg-blue-600" },
    { id: "green", name: "Xanh lá", color: "bg-green-600" },
    { id: "purple", name: "Tím", color: "bg-purple-600" },
    { id: "pink", name: "Hồng", color: "bg-pink-600" },
    { id: "orange", name: "Cam", color: "bg-orange-600" },
    { id: "red", name: "Đỏ", color: "bg-red-600" }
  ];

  const fontSizes = [
    { id: "small", name: "Nhỏ", example: "text-sm" },
    { id: "medium", name: "Vừa", example: "text-base" },
    { id: "large", name: "Lớn", example: "text-lg" }
  ];

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Giao diện -------Này chưa làm</h2>
        
        {/* Theme Selection */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600" />
              Chủ đề
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleSettingChange('theme', theme.id)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    settings.theme === theme.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-8 rounded mb-2 mx-auto ${theme.bg} ${theme.border} border`}></div>
                  <div className="flex items-center justify-center gap-1 text-sm">
                    {theme.icon}
                    <span className="font-medium">{theme.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Màu chủ đạo</h3>
            <p className="text-sm text-gray-500">Chọn màu chủ đạo cho giao diện</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleSettingChange('accentColor', color.id)}
                  className={`relative w-12 h-12 rounded-full ${color.color} transition-transform ${
                    settings.accentColor === color.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  }`}
                  title={color.name}
                >
                  {settings.accentColor === color.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <Type className="w-5 h-5 text-green-600" />
              Kích thước chữ
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {fontSizes.map((size) => (
                <label
                  key={size.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    settings.fontSize === size.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="fontSize"
                    value={size.id}
                    checked={settings.fontSize === size.id}
                    onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                    className="text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{size.name}</span>
                      <span className={`${size.example} text-gray-600`}>
                        Tin nhắn mẫu
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Layout Options */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <Layout className="w-5 h-5 text-purple-600" />
              Bố cục
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Chế độ gọn</h4>
                <p className="text-sm text-gray-500">Giảm khoảng cách giữa các tin nhắn</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={() => handleToggle('compactMode')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Hiển thị avatar</h4>
                <p className="text-sm text-gray-500">Hiển thị ảnh đại diện trong danh sách chat</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showAvatars}
                  onChange={() => handleToggle('showAvatars')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Trạng thái online</h4>
                <p className="text-sm text-gray-500">Hiển thị trạng thái hoạt động của bạn bè</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showOnlineStatus}
                  onChange={() => handleToggle('showOnlineStatus')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Message Style */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Kiểu tin nhắn</h3>
            <p className="text-sm text-gray-500">Chọn kiểu hiển thị cho khung tin nhắn</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSettingChange('messageBubbleStyle', 'rounded')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  settings.messageBubbleStyle === 'rounded'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-2">
                  <div className="w-16 h-8 bg-blue-500 rounded-2xl mb-1 ml-auto"></div>
                  <div className="w-20 h-8 bg-gray-300 rounded-2xl"></div>
                </div>
                <span className="text-sm font-medium">Bo tròn</span>
              </button>
              
              <button
                onClick={() => handleSettingChange('messageBubbleStyle', 'square')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  settings.messageBubbleStyle === 'square'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-2">
                  <div className="w-16 h-8 bg-blue-500 rounded mb-1 ml-auto"></div>
                  <div className="w-20 h-8 bg-gray-300 rounded"></div>
                </div>
                <span className="text-sm font-medium">Vuông</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appearance;