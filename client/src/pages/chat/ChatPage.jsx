import React, { useState, useEffect } from 'react';
import { ConversationList } from './components/ConversationList';
import { ChatArea } from './components/ChatArea';
import { MessageCircle } from 'lucide-react';
import useChatStore from '@/zustand/chatStore';
import useWebSocket from '@/hooks/useWebSocket';
const ChatPage = () => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const {
    conversations,
    activeConversation,
    loadInitialData
  } = useChatStore();
  useWebSocket();

  // Load initial data when component mounts
  useEffect(() => {
    console.log('ChatPage mounted, loading initial data...');
    loadInitialData();
  }, []);

  const handleCreateGroup = () => {
    setShowCreateGroup(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ConversationList 
          onCreateGroup={handleCreateGroup}
          onAddMember={() => {}} // Không cần nữa vì đã có trong GroupSettingsDialog
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <ChatArea conversation={activeConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Chọn một cuộc trò chuyện
              </h3>
              <p className="text-gray-500 mb-4">
                Chọn một cuộc trò chuyện từ danh sách để bắt đầu nhắn tin
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;