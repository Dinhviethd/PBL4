import React, { useState } from 'react';
import { Search, Users, UserPlus, MoreHorizontal, Filter, ChevronDown, Users2, UsersRound, Mail, UserCheck, Handshake, Eye, UserX, Ban, LogOut } from 'lucide-react';

const ContactPage = () => {
  const [activeSection, setActiveSection] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeInviteTab, setActiveInviteTab] = useState('received');
  const [openDropdown, setOpenDropdown] = useState(null);

  // Mock data
  const friends = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    name: 'List item',
    avatar: 'A',
    status: 'online'
  }));

  const groups = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    name: 'List item',
    avatar: 'A',
    members: Math.floor(Math.random() * 20) + 5
  }));

  // Mock data for friend invites
  const sentInvites = [
    { id: 1, name: 'T Phuong', time: '2 phút trước', avatar: 'T' },
    { id: 2, name: 'Lê Minh', time: '2/4/2024', avatar: 'L' },
    { id: 3, name: 'Hello', time: '3 phút trước', avatar: 'H' },
    { id: 4, name: 'Title', time: '2 ngày trước', avatar: 'T' }
  ];

  const receivedInvites = [
    { id: 1, name: 'T Phuong', time: '2 phút trước', message: 'Hello, kết bạn làm quen nhé', avatar: 'T' },
    { id: 2, name: 'Lê Minh', time: '2/4/2024', message: 'Mình liên hệ công việc, bạn kết bạn trao đổi với mình nhé.', avatar: 'L' },
    { id: 3, name: 'Hello', time: '3 phút trước', message: 'Xin chào bạn iu, nhớ tui không nè', avatar: 'H' },
    { id: 4, name: 'Title', time: '2 ngày trước', message: 'Xin chào bạn iu, nhớ tui không nè', avatar: 'T' }
  ];

  // Mock data for group invites
  const groupInvites = [
    { id: 1, name: 'Công Đoàn Cầu Lông Liên Chiều', time: '7 ngày trước', inviter: 'Lời mời từ Nhật' },
    { id: 2, name: '23T_DT2', time: '1/3/2024', inviter: 'Lời mời từ Minh' },
    { id: 3, name: 'Gia sư Đà Nẵng', time: '5 phút trước', inviter: 'Lời mời từ Vy' },
    { id: 4, name: 'Title', time: '1 ngày trước', inviter: 'Lời mời từ Hạ' }
  ];

  const menuItems = [
    { id: 'friends', title: 'Danh sách bạn bè', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'groups', title: 'Danh sách nhóm', icon: <Users2 className="w-5 h-5" /> },
    { id: 'invites', title: 'Lời mời kết bạn', icon: <UserPlus className="w-5 h-5" /> },
    { id: 'pending', title: 'Lời mời vào nhóm', icon: <Handshake className="w-5 h-5" /> }
  ];

  // Friends List Component
  const FriendsList = () => (
    <div className="p-6">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Danh sách bạn bè (11)</h2>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
            <span className="text-sm text-gray-600">Tên (A-Z)</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Tất cả</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Friends List */}
        <div className="space-y-2">
          {friends.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">{friend.avatar}</span>
                </div>
                <span className="text-sm text-gray-800">{friend.name}</span>
              </div>
              <div className="relative">
                <button 
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setOpenDropdown(openDropdown === `friend-${friend.id}` ? null : `friend-${friend.id}`)}
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
                
                {/* Dropdown Menu */}
                {openDropdown === `friend-${friend.id}` && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Eye className="w-4 h-4" />
                        Xem thông tin
                      </button>
                      <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <UserX className="w-4 h-4" />
                        Xóa bạn
                      </button>
                      <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <Ban className="w-4 h-4" />
                        Chặn
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Groups List Component  
  const GroupsList = () => (
    <div className="p-6">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Danh sách nhóm (11)</h2>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
            <span className="text-sm text-gray-600">Tên (A-Z)</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Tất cả</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">{group.avatar}</span>
                </div>
                <span className="text-sm text-gray-800">{group.name}</span>
              </div>
              <div className="relative">
                <button 
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setOpenDropdown(openDropdown === `group-${group.id}` ? null : `group-${group.id}`)}
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
                
                {/* Dropdown Menu */}
                {openDropdown === `group-${group.id}` && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="w-4 h-4" />
                        Rời khỏi nhóm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Friend Invites Component
  const FriendInvites = () => (
    <div className="p-6">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Lời mời kết bạn</h2>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveInviteTab('sent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeInviteTab === 'sent'
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Lời mời đã gửi (4)
          </button>
          <button
            onClick={() => setActiveInviteTab('received')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeInviteTab === 'received'
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Lời mời đã nhận (4)
          </button>
        </div>

        {/* Content based on active tab */}
        {activeInviteTab === 'received' ? (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Đã nhận 4 lời mời</p>
            </div>

            {/* Received Invites Grid */}
            <div className="grid grid-cols-2 gap-4">
              {receivedInvites.map((invite) => (
                <div key={invite.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex gap-2 justify-end mb-3">
                    <button className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">
                      Từ chối
                    </button>
                    <button className="text-sm text-white bg-blue-500 px-3 py-1.5 rounded hover:bg-blue-600">
                      Chấp nhận
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{invite.avatar}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{invite.name}</p>
                      <p className="text-xs text-gray-500">{invite.time}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">{invite.message}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Đã gửi 4 lời mời</p>
            </div>

            {/* Sent Invites Grid */}
            <div className="grid grid-cols-2 gap-4">
              {sentInvites.map((invite) => (
                <div key={invite.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{invite.avatar}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{invite.name}</p>
                      <p className="text-xs text-gray-500">{invite.time}</p>
                    </div>
                  </div>
                  <button className="w-full py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                    Thu hồi lời mời
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Group Invites Component
  const GroupInvites = () => (
    <div className="p-6">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Lời mời tham gia nhóm</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">Đã nhận 4 lời mời tham gia nhóm</p>
        </div>

        {/* Group Invites Grid */}
        <div className="grid grid-cols-2 gap-4">
          {groupInvites.map((invite) => (
            <div key={invite.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex gap-2 justify-end mb-3">
                <button className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">
                  Từ chối
                </button>
                <button className="text-sm text-white bg-blue-500 px-3 py-1.5 rounded hover:bg-blue-600">
                  Chấp nhận
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users2 className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{invite.name}</p>
                  <p className="text-xs text-gray-500">{invite.time}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">{invite.inviter}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'friends': return <FriendsList />;
      case 'groups': return <GroupsList />;
      case 'invites': return <FriendInvites />;
      case 'pending': return <GroupInvites />;
      default: return <FriendsList />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex" onClick={() => setOpenDropdown(null)}>
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800 mb-4">ChatMate</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="search"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-colors ${
                activeSection === item.id
                  ? "bg-blue-100 text-blue-600"
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
      <div className="flex-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  );
};

export default ContactPage;