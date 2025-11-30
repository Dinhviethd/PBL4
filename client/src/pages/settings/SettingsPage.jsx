import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Shield, Lock, Palette, CheckCircle, XCircle } from "lucide-react";
import AccountSecurity from "./components/AccountSecurity";
import Appearance from "./components/Appearance";
import Privacy from "./components/Privacy";

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("account");
  const [notification, setNotification] = useState(null);
  const location = useLocation();

  // Check for navigation state message
  useEffect(() => {
    if (location.state && location.state.message) {
      setNotification({
        message: location.state.message,
        type: location.state.type || 'success'
      });
      
      // Clear the notification after 5 seconds
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      
      // Clear navigation state to prevent re-showing on refresh
      window.history.replaceState({}, document.title);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const closeNotification = () => {
    setNotification(null);
  };

  const menuItems = [
    {
      id: "account",
      title: "Tài khoản và bảo mật",
      icon: <Shield className="w-5 h-5" />,
      component: AccountSecurity
    },
    {
      id: "privacy",
      title: "Quyền riêng tư",
      icon: <Lock className="w-5 h-5" />,
      component: Privacy
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
      <div className="flex-1 overflow-y-auto relative">
        {/* Notification Banner */}
        {notification && (
          <div className={`fixed top-4 right-4 left-[340px] z-50 max-w-md ml-auto mr-4 ${
            notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          } border rounded-lg shadow-lg`}>
            <div className="flex items-center p-4">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={closeNotification}
                  className={`inline-flex rounded-md ${
                    notification.type === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === 'success' ? 'focus:ring-green-500' : 'focus:ring-red-500'
                  }`}
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default SettingsPage;