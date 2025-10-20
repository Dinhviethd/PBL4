import React, { useState, useEffect, useRef } from 'react';
import Button from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Users,
  Phone,
  Video,
  Info,
  Edit3,
  Trash2,
  Check,
  CheckCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useChatStore from '@/zustand/chatStore';
import useAuthStore from '@/zustand/authStore';
import messageService from '@/services/message.service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const ChatArea = ({ conversation }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { user } = useAuthStore();
  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    getConversationKey,
    clearUnreadCount,
    typingUsers,
    socket
  } = useChatStore();

  const conversationKey = getConversationKey(conversation);
  const conversationMessages = messages[conversationKey] || [];

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      try {
        let response;
        if (conversation.type === 'private') {
          response = await messageService.getPrivateMessages(conversation.partnerId);
        } else {
          response = await messageService.getGroupMessages(conversation.groupId);
        }
        
        setMessages(conversationKey, response.data || []);
        clearUnreadCount(conversationKey);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [conversationKey]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Handle typing indicator
  useEffect(() => {
    if (socket && message && conversation.type === 'private') {
      socket.send(JSON.stringify({
        type: 'typing',
        to: conversation.partnerId,
        isTyping: true
      }));

      const timeout = setTimeout(() => {
        socket.send(JSON.stringify({
          type: 'typing',
          to: conversation.partnerId,
          isTyping: false
        }));
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [message, socket, conversation]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const messageContent = message.trim();
    setMessage('');

    try {
      let response;
      if (conversation.type === 'private') {
        response = await messageService.sendPrivateMessage(
          conversation.partnerId, 
          messageContent
        );
      } else {
        response = await messageService.sendGroupMessage(
          conversation.groupId, 
          messageContent
        );
      }

      addMessage(conversationKey, response.data);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-add message to input on error
      setMessage(messageContent);
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message.idMessage);
    setEditContent(message.content);
  };

  const handleSaveEdit = async (messageId) => {
    try {
      await messageService.editMessage(messageId, editContent);
      updateMessage(conversationKey, messageId, {
        content: editContent,
        isEdited: true,
        editedAt: new Date()
      });
      setEditingMessage(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      deleteMessage(conversationKey, messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await messageService.markAsRead(messageId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const isPartnerTyping = conversation.type === 'private' && 
    typingUsers[conversation.partnerId];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <Avatar className="w-10 h-10 mr-3">
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
          
          <div>
            <h2 className="font-semibold text-gray-900">
              {conversation.type === 'private' 
                ? conversation.partner?.name || 'Unknown User'
                : conversation.group?.name || 'Unknown Group'
              }
            </h2>
            {conversation.type === 'private' ? (
              <p className="text-sm text-gray-500">
                {isPartnerTyping ? 'Đang nhập...' : 'Hoạt động'}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                {conversation.memberCount || 0} thành viên
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversationMessages.map((msg) => {
            const isOwn = msg.sender.idUser === user?.idUser;
            const isEditing = editingMessage === msg.idMessage;

            return (
              <div
                key={msg.idMessage}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwn && (
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarImage src={msg.sender.avatarUrl} />
                      <AvatarFallback>
                        {msg.sender.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && conversation.type === 'group' && (
                      <span className="text-xs text-gray-500 mb-1 px-3">
                        {msg.sender.name}
                      </span>
                    )}

                    <div
                      className={`relative group px-4 py-2 rounded-2xl max-w-full ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } ${msg.isDeleted ? 'opacity-50 italic' : ''}`}
                    >
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(msg.idMessage)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.isDeleted ? 'Tin nhắn đã được thu hồi' : msg.content}
                          </p>
                          
                          {msg.isEdited && !msg.isDeleted && (
                            <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                              (đã chỉnh sửa)
                            </span>
                          )}
                        </>
                      )}

                      {/* Message actions */}
                      {isOwn && !msg.isDeleted && !isEditing && (
                        <div className="absolute top-0 right-0 -mr-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditMessage(msg)}>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteMessage(msg.idMessage)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Thu hồi
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>

                    {/* Message info */}
                    <div className={`flex items-center mt-1 space-x-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(msg.createdAt), {
                          addSuffix: true,
                          locale: vi
                        })}
                      </span>
                      
                      {isOwn && (
                        <div className="flex items-center">
                          {msg.readers?.length > 0 ? (
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Read receipts */}
                    {isOwn && msg.readers?.length > 0 && (
                      <div className="flex items-center mt-1">
                        <div className="flex -space-x-1">
                          {msg.readers.slice(0, 3).map((reader) => (
                            <Avatar key={reader.idUser} className="w-4 h-4 border border-white">
                              <AvatarImage src={reader.avatarUrl} />
                              <AvatarFallback className="text-xs">
                                {reader.name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        {msg.readers.length > 3 && (
                          <span className="text-xs text-gray-500 ml-2">
                            +{msg.readers.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Typing indicator */}
          {isPartnerTyping && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={conversation.partner?.avatarUrl} />
                  <AvatarFallback>
                    {conversation.partner?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};