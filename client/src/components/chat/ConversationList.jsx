import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Settings, Clock } from 'lucide-react';
import useChatStore from '@/zustand/chatStore';
import { messageService } from '@/services/message.service';
import groupService from '@/services/group.service';
import GroupManagement from '@/components/chat/GroupManagement';
import useAuthStore from "@/zustand/authStore";

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

  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [selectedGroupForManagement, setSelectedGroupForManagement] = useState(null);
  const [groupPendingCounts, setGroupPendingCounts] = useState({}); // Store pending counts for each group
const { accessToken } = useAuthStore();
const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  const unsub = useAuthStore.persist.onFinishHydration(() => {
    setHydrated(true);
  });
  return () => unsub();
}, []);

useEffect(() => {
  if (!hydrated || !accessToken) return; // tránh gọi sớm khi token chưa có
  loadConversations();
  loadGroups();
}, [hydrated, accessToken]);

  useEffect(() => {
    // Load pending counts for admin groups
    groups.forEach(group => {
      if (group.userRole === 'ADMIN') {
        loadPendingCount(group.idGroup);
      }
    });
  }, [groups]);

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

  const loadPendingCount = async (groupId) => {
    try {
      const response = await groupService.getPendingMembers(groupId);
      setGroupPendingCounts(prev => ({
        ...prev,
        [groupId]: response.data?.length || 0
      }));
    } catch (error) {
      // Ignore 403 errors for non-admin users
      if (error.response?.status !== 403) {
        console.error('Failed to load pending count:', error);
      }
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

  const handleGroupSettings = async (group, e) => {
    e.stopPropagation();
    try {
      const response = await groupService.getGroupDetails(group.idGroup);
      setSelectedGroupForManagement(response.data);
      setShowGroupManagement(true);
    } catch (error) {
      console.error('Failed to load group details:', error);
    }
  };

  const handleGroupManagementUpdate = () => {
    loadGroups();
    // Reload pending count for the selected group
    if (selectedGroupForManagement) {
      loadPendingCount(selectedGroupForManagement.idGroup);
    }
  };

  const getConversationName = (conversation) => {
    const friend = conversation.sentBy.idUser !== conversation.sendToUser?.idUser 
      ? (conversation.sentBy.name || 'Unknown') 
      : (conversation.sendToUser?.name || 'Unknown');
    return friend;
  };

  return (
    <>
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
              {groups.map((group) => {
                const pendingCount = groupPendingCounts[group.idGroup] || 0;
                
                return (
                  <div
                    key={group.idGroup}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      currentGroup?.idGroup === group.idGroup
                        ? 'bg-blue-50 border border-blue-200'
                        : ''
                    }`}
                  >
                    <div onClick={() => selectGroup(group)} className="flex items-center space-x-3 flex-1">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback>
                            {group.name?.charAt(0).toUpperCase() || 'G'}
                          </AvatarFallback>
                        </Avatar>
                        {/* Pending notification badge */}
                        {group.userRole === 'ADMIN' && pendingCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {pendingCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {group.name}
                          </p>
                          {group.userRole === 'ADMIN' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <p className="text-sm text-gray-500">Group chat</p>
                          {group.userRole === 'ADMIN' && pendingCount > 0 && (
                            <div className="flex items-center space-x-1 text-orange-600">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{pendingCount} pending</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleGroupSettings(group, e)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Group settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Group Management Modal */}
      {showGroupManagement && selectedGroupForManagement && (
        <GroupManagement
          group={selectedGroupForManagement}
          onUpdate={handleGroupManagementUpdate}
          onClose={() => {
            setShowGroupManagement(false);
            setSelectedGroupForManagement(null);
          }}
        />
      )}
    </>
  );
};

export default ConversationList;