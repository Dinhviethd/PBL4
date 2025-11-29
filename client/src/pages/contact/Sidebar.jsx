import React from 'react';
import { UserPlus, Users2, Handshake } from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection, pendingInviteCount = 0, pendingGroupInviteCount = 0 }) => {
  const menuItems = [
    { id: 'friends', title: 'Danh sách bạn bè', icon: <UserPlus className="w-5 h-5" /> },
    { id: 'groups', title: 'Danh sách nhóm', icon: <Users2 className="w-5 h-5" /> },
    { id: 'invites', title: 'Lời mời kết bạn', icon: <UserPlus className="w-5 h-5" />, hasBadge: pendingInviteCount > 0 },
    { id: 'pending', title: 'Lời mời vào nhóm', icon: <Handshake className="w-5 h-5" />, hasBadge: pendingGroupInviteCount > 0 }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm animate-fade-in-down">
        <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg">💬</span> ChatMate
        </h1>
      </div>
      <div className="flex-1 py-2">
        {menuItems.map(item => (
          <div
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-colors relative ${
              activeSection === item.id ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className={`${activeSection === item.id ? 'text-blue-600' : 'text-gray-500'}`}>{item.icon}</div>
            <span className="text-sm font-medium">{item.title}</span>
            {item.hasBadge && (
              <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
