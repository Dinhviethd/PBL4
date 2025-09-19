import React, { useState } from "react";
import { Shield, Bell, Palette } from "lucide-react";
import AccountSecurity from "./components/AccountSecurity";
import Notifications from "./components/Notifications";
import Appearance from "./components/Appearance";

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("account");

  const menuItems = [
    {
      id: "account",
      title: "Tài khoản và bảo mật",
      icon: <Shield className="w-5 h-5" />,
      component: AccountSecurity
    },
    {
      id: "notifications", 
      title: "Thông báo",
      icon: <Bell className="w-5 h-5" />,
      component: Notifications
    },
    {
      id: "appearance",
      title: "Giao diện", 
      icon: <Palette className="w-5 h-5" />,
      component: Appearance
    }
  ];

  const ActiveComponent = menuItems.find(item => item.id === activeSection)?.component;

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Settings Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Cài đặt</h1>
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-colors ${
                activeSection === item.id
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className={`${
                activeSection === item.id ? "text-blue-600" : "text-gray-500"
              }`}>
                {item.icon}
              </div>
              <span className="text-sm font-medium">{item.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default SettingsPage;