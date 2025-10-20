import React, { useState } from 'react';
import Button from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Plus, 
  Users, 
  MessageCircle,
  MoreVertical,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StartConversationDialog } from './StartConversationDialog';
import useChatStore from '@/zustand/chatStore';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const ConversationList = ({ onCreateGroup, onAddMember }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showStartConversation, setShowStartConversation] = useState(false);
  
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    unreadCounts,
    groups,
    onlineUsers
  } = useChatStore();

  const filteredConversations = conversations.filter(conv =>
    conv.type === 'private'
      ? conv.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : conv.group?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const getConversationKey = (conversation) => {
    return conversation.type === 'private' 
      ? `private_${conversation.partnerId}`
      : `group_${conversation.groupId}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Tin nhắn</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowStartConversation(true)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Bắt đầu trò chuyện
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateGroup}>
                <Users className="w-4 h-4 mr-2" />
                Tạo nhóm mới
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm mb-3">
                {searchQuery ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}
              </p>
              {!searchQuery && (
                <Button 
                  size="sm" 
                  onClick={() => setShowStartConversation(true)}
                >
                  Bắt đầu trò chuyện
                </Button>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const conversationKey = getConversationKey(conversation);
              const unreadCount = unreadCounts[conversationKey] || 0;
              const isActive = activeConversation && 
                getConversationKey(activeConversation) === conversationKey;

              return (
                <div
                  key={conversationKey}
                  className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 mb-1 ${
                    isActive ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                  onClick={() => handleConversationClick(conversation)}
                >
                  {/* Avatar */}
                  <div className="relative mr-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={conversation.type === 'private' 
                          ? conversation.partner?.avatarUrl 
                          : '/images/group-avatar.png'
                        } 
                      />
                      <AvatarFallback>
                        {conversation.type === 'private' 
                          ? conversation.partner?.name?.charAt(0)?.toUpperCase() || 'U'
                          : <Users className="w-5 h-5" />
                        }
                      </AvatarFallback>
                    </Avatar>
                    {conversation.type === 'private' && isUserOnline(conversation.partnerId) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.type === 'private' 
                          ? conversation.partner?.name || 'Unknown User'
                          : conversation.group?.name || 'Unknown Group'
                        }
                      </h3>
                      <div className="flex items-center space-x-2">
                        {conversation.lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.lastMessageTime), {
                              addSuffix: true,
                              locale: vi
                            })}
                          </span>
                        )}
                        {conversation.type === 'group' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddMember(conversation.group);
                                }}
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Thêm thành viên
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage || 'Chưa có tin nhắn nào'}
                      </p>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Start Conversation Dialog */}
      <StartConversationDialog
        open={showStartConversation}
        onClose={() => setShowStartConversation(false)}
      />
    </div>
  );
};