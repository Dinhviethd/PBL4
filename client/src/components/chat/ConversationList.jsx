// src/components/chat/ConversationList.jsx
import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import useChatStore from '@/zustand/chatStore';
import { messageService } from '@/services/message.service';
import { groupService } from '@/services/group.service';

const ConversationList = () => {
  const {
    conversations,
    groups,
    currentConversation,
    currentGroup,
    setConversations,
    setGroups,
    setCurrentConversation,
    setCurrentGroup
  } = useChatStore();

  useEffect(() => {
    loadConversations();
    loadGroups();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await messageService.getRecentConversations();
      setConversations(response.data.privateMessages || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await groupService.getUserGroups();
      setGroups(response.data || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const selectConversation = (conversation) => {
    const friendId = conversation.sentBy.idUser === conversation.sendToUser?.idUser 
      ? conversation.sentBy.idUser 
      : conversation.sendToUser?.idUser;
    
    const friend = conversation.sentBy.idUser === friendId 
      ? conversation.sentBy 
      : conversation.sendToUser;
    
    setCurrentConversation({ ...friend, friendId });
  };

  const selectGroup = (group) => {
    setCurrentGroup(group);
  };

  const getConversationName = (conversation) => {
    const friend = conversation.sentBy.idUser !== conversation.sendToUser?.idUser 
      ? (conversation.sentBy.name || 'Unknown') 
      : (conversation.sendToUser?.name || 'Unknown');
    return friend;
  };

  return (
    <div className="w-80 border-r border-gray-200 bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
      </div>
      
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-2">
          {/* Private Conversations */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">Private Chats</h3>
            {conversations.map((conversation, index) => (
              <div
                key={`conversation-${index}`}
                onClick={() => selectConversation(conversation)}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                  currentConversation?.idUser === (conversation.sentBy.idUser === conversation.sendToUser?.idUser ? conversation.sentBy.idUser : conversation.sendToUser?.idUser)
                    ? 'bg-blue-50 border border-blue-200'
                    : ''
                }`}
              >
                <Avatar>
                  <AvatarImage src={conversation.sentBy.avatarUrl} />
                  <AvatarFallback>
                    {getConversationName(conversation).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getConversationName(conversation)}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.content}
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(conversation.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Groups */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">Groups</h3>
            {groups.map((group) => (
              <div
                key={group.idGroup}
                onClick={() => selectGroup(group)}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                  currentGroup?.idGroup === group.idGroup
                    ? 'bg-blue-50 border border-blue-200'
                    : ''
                }`}
              >
                <Avatar>
                  <AvatarFallback>
                    {group.name?.charAt(0).toUpperCase() || 'G'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {group.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Group chat
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationList;