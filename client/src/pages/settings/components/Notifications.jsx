import React, { useState } from "react";
import { Bell, MessageCircle, UserPlus, Volume2 } from "lucide-react";

const Notifications = () => {
  const [settings, setSettings] = useState({
    messageNotifications: true,
    friendRequests: true,
    groupInvites: true,
    soundEffects: true,
    desktopNotifications: true,
    emailNotifications: false,
    doNotDisturb: false,
    quietHours: false,
    quietStart: "22:00",
    quietEnd: "08:00"
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleTimeChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Thông báo -------Này chưa làm </h2>
        
        {/* Message Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Tin nhắn
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Thông báo tin nhắn mới</h4>
                <p className="text-sm text-gray-500">Nhận thông báo khi có tin nhắn mới</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.messageNotifications}
                  onChange={() => handleToggle('messageNotifications')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Thông báo trên desktop</h4>
                <p className="text-sm text-gray-500">Hiển thị thông báo trên màn hình desktop</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.desktopNotifications}
                  onChange={() => handleToggle('desktopNotifications')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Social Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Bạn bè và nhóm
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Lời mời kết bạn</h4>
                <p className="text-sm text-gray-500">Thông báo khi có lời mời kết bạn mới</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.friendRequests}
                  onChange={() => handleToggle('friendRequests')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Lời mời tham gia nhóm</h4>
                <p className="text-sm text-gray-500">Thông báo khi được mời vào nhóm chat</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.groupInvites}
                  onChange={() => handleToggle('groupInvites')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Sound & Quiet Hours */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-600" />
              Âm thanh và giờ yên lặng
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Âm thanh thông báo</h4>
                <p className="text-sm text-gray-500">Phát âm thanh khi có thông báo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={() => handleToggle('soundEffects')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Chế độ không làm phiền</h4>
                <p className="text-sm text-gray-500">Tắt tất cả thông báo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.doNotDisturb}
                  onChange={() => handleToggle('doNotDisturb')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Giờ yên lặng</h4>
                  <p className="text-sm text-gray-500">Tự động tắt thông báo trong khoảng thời gian này</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.quietHours}
                    onChange={() => handleToggle('quietHours')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {settings.quietHours && (
                <div className="flex gap-4 items-center">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Từ</label>
                    <input
                      type="time"
                      value={settings.quietStart}
                      onChange={(e) => handleTimeChange('quietStart', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Đến</label>
                    <input
                      type="time"
                      value={settings.quietEnd}
                      onChange={(e) => handleTimeChange('quietEnd', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-600" />
              Email
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Thông báo qua email</h4>
                <p className="text-sm text-gray-500">Nhận thông báo quan trọng qua email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;