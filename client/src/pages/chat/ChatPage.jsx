import React, { useState, useEffect } from 'react';
import { ConversationList } from './components/ConversationList';
import { ChatArea } from './components/ChatArea';
import { CreateGroupDialog } from './components/CreateGroupDialog';
import { AddMemberDialog } from './components/AddMemberDialog';
import { MessageCircle } from 'lucide-react';
import useChatStore from '@/zustand/chatStore';
import useWebSocket from '@/hooks/useWebSocket';
import messageService from '@/services/message.service';
import groupService from '@/services/group.service';

const ChatPage = () => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedGroupForAddMember, setSelectedGroupForAddMember] = useState(null);

  const {
    conversations,
    activeConversation,
    setConversations,
    setGroups
  } = useChatStore();

  // Initialize WebSocket
  useWebSocket();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load conversations
        const conversationsData = await messageService.getRecentConversations();
        setConversations(conversationsData.data || []);

        // Load user groups
        const groupsData = await groupService.getUserGroups();
        setGroups(groupsData.data || []);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  const handleCreateGroup = () => {
    setShowCreateGroup(true);
  };

  const handleAddMember = (group) => {
    setSelectedGroupForAddMember(group);
    setShowAddMember(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ConversationList 
          onCreateGroup={handleCreateGroup}
          onAddMember={handleAddMember}
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

      {/* Dialogs */}
      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
      
      <AddMemberDialog
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
        group={selectedGroupForAddMember}
      />
    </div>
  );
};

export default ChatPage;