import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getAvatarUrl } from '@/lib/utils';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Users,
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
import useWebRTC from '@/hooks/useWebRTC';
import useCallSignaling from '@/hooks/useCallSignaling';
import CallButtons from '@/components/call/CallButtons';
import { IncomingCallModal } from '@/components/call/IncomingCallModal';
import { CallHistoryItem } from '@/components/call/CallHistoryItem';
import { GroupSettingsDialog } from './GroupSettingsDialog';

// Helper function to format time
const formatTimeAgo = (date) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  
  return messageDate.toLocaleDateString('vi-VN');
};

// Helper function to generate group avatar display (first letter)
const getGroupAvatarDisplay = (groupName = '') => {
  // Returns an SVG with the first letter (or colored circle)
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2360A5FA'/%3E%3Ctext x='50' y='65' font-size='40' font-weight='bold' fill='white' text-anchor='middle'%3E${groupName.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
};

export const ChatArea = ({ conversation }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);
  const previousScrollHeight = useRef(0);
  const previousMessageCount = useRef(0);

  console.log('🟢 ChatArea render - showGroupSettings:', showGroupSettings);
  console.log('🟢 Conversation type:', conversation.type);

  const { user } = useAuthStore();
  
  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    getConversationKey,
    clearUnreadCount,
    updateConversation,
    addConversation,
    typingUsers,
    socket,
    activeCall,
    setActiveCall,
    setIsCaller,
    clearActiveCall
  } = useChatStore();

  // Initialize WebRTC hook
  const callType = activeCall?.callType || 'audio';
  const webRTC = useWebRTC(callType);

  // Initialize Call Signaling hook (for initiating calls)
  const {
    callInfo,
    initiateCall,
    sendOffer,
    acceptCall,
    declineCall
  } = useCallSignaling(webRTC);

  const conversationKey = getConversationKey(conversation);
  const conversationMessages = useMemo(
    () => messages[conversationKey] || [],
    [messages, conversationKey]
  );

  useEffect(() => {
    // callInfo changes will automatically update the popup visibility
  }, [callInfo]);

  // Merge messages and calls into a single timeline
  const timeline = useMemo(() => {
    // First, deduplicate call messages by callId
    const seenCallIds = new Set();
    const deduplicatedMessages = conversationMessages.filter(msg => {
      if (msg.type === 'call' && msg.call) {
        const callId = msg.call.idCall;
        if (seenCallIds.has(callId)) {
          console.warn(`⚠️ Duplicate call message detected for callId: ${callId}`);
          return false; // Skip duplicate
        }
        seenCallIds.add(callId);
      }
      return true;
    });
    
    const items = deduplicatedMessages.map(msg => {
      if (msg.type === 'call' && msg.call) {
        // Call message type - use call data for timestamp
        return {
          type: 'call',
          data: msg.call,
          timestamp: new Date(msg.createdAt)
        };
      }
      // Regular message
      return {
        type: 'message',
        data: msg,
        timestamp: new Date(msg.createdAt)
      };
    });
    
    
    // Already sorted by backend (ASC), but just to be safe
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }, [conversationMessages]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      
      // Reset pagination state when conversation changes
      setPage(1);
      setHasMore(true);
      setIsInitialLoad(true); // Mark as initial load
      previousMessageCount.current = 0;
      
      try {
        let response;
        if (conversation.type === 'private') {
          response = await messageService.getPrivateMessages(conversation.partnerId, 1, 20);
        } else {
          response = await messageService.getGroupMessages(conversation.groupId, 1, 20);
        }
        
        setMessages(conversationKey, response.data || []);
        setHasMore(response.data?.length === 20); // If less than 20, no more messages
        previousMessageCount.current = response.data?.length || 0;
        
        // Mark as read if there are unread messages
        // Use unreadCount from conversation object (from API) instead of store
        const currentUnreadCount = conversation.unreadCount || 0;
        
        if (currentUnreadCount > 0) {
          try {
            // Update UI immediately - optimistic update
            const conversationId = conversation.type === 'private' ? conversation.partnerId : conversation.groupId;
            updateConversation(conversation.type, conversationId, { unreadCount: 0 });
            clearUnreadCount(conversationKey);
            
            // Then call API
            await messageService.markConversationAsRead(
              conversation.type,
              conversationId
            );
          } catch (error) {
            console.error('❌ [ChatArea] Failed to mark conversation as read:', error);
            // Rollback on error
            updateConversation(
              conversation.type,
              conversation.type === 'private' ? conversation.partnerId : conversation.groupId,
              { unreadCount: currentUnreadCount }
            );
          }
        } else {
          clearUnreadCount(conversationKey);
        }
      } catch (error) {
        console.error('❌ [ChatArea] Failed to load messages:', error);
      }
    };

    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationKey]); // Only run when conversation changes

  // Scroll to bottom only for initial load or new messages (not when loading more old messages)
  useEffect(() => {
    const currentMessageCount = conversationMessages.length;
    
    // Only scroll to bottom if:
    // 1. Initial load (first time opening conversation)
    // 2. New message added (count increased and not loading more)
    if (isInitialLoad) {
      // Initial load - scroll to bottom after a brief delay to ensure DOM is ready
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        setIsInitialLoad(false);
      }, 100);
    } else if (currentMessageCount > previousMessageCount.current && !isLoadingMore) {
      // New message arrived (not from loading more old messages)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    previousMessageCount.current = currentMessageCount;
  }, [conversationMessages, isInitialLoad, isLoadingMore]);

  // Handle scroll to load more messages
  const handleScroll = async (e) => {
    const scrollElement = e.target;
    const scrollTop = scrollElement.scrollTop;
    
    // Check if scrolled near top (within 100px)
    if (scrollTop < 100 && !isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      
      // Save current scroll height to restore position after loading
      previousScrollHeight.current = scrollElement.scrollHeight;
      
      try {
        const nextPage = page + 1;
        let response;
        
        if (conversation.type === 'private') {
          response = await messageService.getPrivateMessages(conversation.partnerId, nextPage, 20);
        } else {
          response = await messageService.getGroupMessages(conversation.groupId, nextPage, 20);
        }
        
        if (response.data && response.data.length > 0) {
          
          // Prepend old messages to existing messages
          const currentMessages = messages[conversationKey] || [];
          const newMessages = [...response.data, ...currentMessages];
          
          // Update message count before setting messages to prevent scroll to bottom
          previousMessageCount.current = newMessages.length;
          setMessages(conversationKey, newMessages);
          
          setPage(nextPage);
          setHasMore(response.data.length === 20);
          
          // Restore scroll position after a brief delay to allow DOM update
          setTimeout(() => {
            const newScrollHeight = scrollElement.scrollHeight;
            const scrollDiff = newScrollHeight - previousScrollHeight.current;
            scrollElement.scrollTop = scrollTop + scrollDiff;
          }, 100);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('❌ [ChatArea] Failed to load more messages:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

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

  const handleInputFocus = async () => {
    // Always mark as read when user focuses on input (regardless of unreadCount)
    try {
      
      const conversationId = conversation.type === 'private' ? conversation.partnerId : conversation.groupId;
      
      // Update UI immediately - optimistic update
      updateConversation(conversation.type, conversationId, { unreadCount: 0 });
      clearUnreadCount(conversationKey);
      
      // Always call API to ensure backend is synced
      await messageService.markConversationAsRead(
        conversation.type,
        conversationId
      );
      
    } catch (error) {
      console.error('❌ [ChatArea] Failed to mark conversation as read:', error);
      // Rollback on error
      const conversationId = conversation.type === 'private' ? conversation.partnerId : conversation.groupId;
      const currentUnreadCount = conversation.unreadCount || 0;
      updateConversation(
        conversation.type,
        conversationId,
        { unreadCount: currentUnreadCount }
      );
    }
  };

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
      
      console.log('📤 [ChatArea] Sending message and updating conversation:', {
        type: conversation.type,
        partnerId: conversation.partnerId,
        groupId: conversation.groupId,
        lastMessage: messageContent
      });
      
      // Update conversation with the new last message and move to top
      addConversation({
        type: conversation.type,
        partnerId: conversation.type === 'private' ? conversation.partnerId : undefined,
        groupId: conversation.type === 'group' ? conversation.groupId : undefined,
        partner: conversation.type === 'private' ? conversation.partner : undefined,
        group: conversation.type === 'group' ? conversation.group : undefined,
        lastMessage: messageContent,
        lastMessageTime: response.data.createdAt || new Date().toISOString(),
        lastMessageType: 'text',
        unreadCount: 0 // Own message, so unreadCount is 0
      });
    } catch (error) {
      console.error('❌ [ChatArea] Failed to send message:', error);
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

  // ==================== CALL HANDLERS ====================

  // Handle accept incoming call
  const handleAcceptIncomingCall = () => {
    if (callInfo && callInfo.callId) {

      setActiveCall({
        callId: callInfo.callId,
        fromUserId: callInfo.fromUserId,
        toUserId: user?.idUser,
        callType: callInfo.callType,
        caller: callInfo.caller,
        status: 'accepted'
      });
      
      acceptCall(callInfo.callId, callInfo.fromUserId);
      
      // Store call settings for CallPage
      sessionStorage.setItem('callSettings', JSON.stringify({
        cameraEnabled: true,
        micEnabled: true
      }));
      
    } else {
      console.warn('❌ Cannot accept - callInfo missing:', callInfo);
    }
  };

  // Handle decline incoming call
  const handleDeclineIncomingCall = () => {
    if (callInfo && callInfo.callId) {
      declineCall(callInfo.callId, callInfo.fromUserId);
    } else {
      console.warn('❌ Cannot decline - callInfo missing:', callInfo);
    }
  };

  // Audio Call Handler
  const handleAudioCall = async () => {
    try {
      if (!conversation || conversation.type !== "private") {
        console.error("Audio call only available for private conversations");
        return;
      }

      const toUserId = conversation.partnerId;

      // Set active call state
      setActiveCall({
        callType: "audio",
        toUserId,
        fromUserId: user.idUser,
        startTime: new Date(),
      });
      setIsCaller(true);

      // Save call settings to sessionStorage for CallPage
      sessionStorage.setItem('callSettings', JSON.stringify({
        cameraEnabled: false,
        micEnabled: true
      }));

      // Initiate call through WebSocket signaling
      await initiateCall(toUserId, "audio");

      // Send offer after short delay (wait for call ID from server)
      setTimeout(() => {
        if (callInfo?.callId) {
          sendOffer(callInfo.callId, toUserId);
        }
      }, 500);

      // Navigate to CallPage
      navigate('/call');
    } catch (error) {
      console.error("Error initiating audio call:", error);
      clearActiveCall();
    }
  };

  // Video Call Handler
  const handleVideoCall = async () => {
    try {
      if (!conversation || conversation.type !== "private") {
        console.error("Video call only available for private conversations");
        return;
      }

      const toUserId = conversation.partnerId;

      setActiveCall({
        callType: "video",
        toUserId,
        fromUserId: user.idUser,
        startTime: new Date(),
      });
      setIsCaller(true);

      // Save call settings to sessionStorage for CallPage
      sessionStorage.setItem('callSettings', JSON.stringify({
        cameraEnabled: true,
        micEnabled: true
      }));

      await initiateCall(toUserId, "video");

      setTimeout(() => {
        if (callInfo?.callId) {
          sendOffer(callInfo.callId, toUserId);
        }
      }, 500);

      // Navigate to CallPage
      navigate('/call');
    } catch (error) {
      console.error("Error initiating video call:", error);
      clearActiveCall();
    }
  };


  const isPartnerTyping = conversation.type === 'private' && 
    typingUsers[conversation.partnerId];

  return (
    <div className="flex flex-col h-full">
      {/* Incoming Call Modal */}
      {callInfo && (
        <IncomingCallModal
          callInfo={callInfo}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
          autoRejectTime={45}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage 
              src={conversation.type === 'private' 
                ? getAvatarUrl(conversation.partner?.avatarUrl)
                : getGroupAvatarDisplay(conversation.group?.name || 'G')
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
                ? (conversation.partner?.name || 'Unknown User')
                : (conversation.group?.name || 'Unknown Group')
              }
            </h2>
            {conversation.type === 'private' ? (
              <p className="text-sm text-gray-500">
                {typingUsers?.[conversation.partnerId] ? 'Đang nhập...' : 'Hoạt động'}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Call Buttons - chỉ hiển thị cho private conversations */}
          {conversation.type === 'private' && (
            <CallButtons
              onAudioCallClick={handleAudioCall}
              onVideoCallClick={handleVideoCall}
            />
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              if (conversation.type === 'group') {
                setShowGroupSettings(true);
              } else {
                console.log('⚠️ Not a group conversation');
              }
            }}
            className="hover:bg-gray-100"
            title={conversation.type === 'group' ? 'Thông tin nhóm' : 'Thông tin'}
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} onScrollCapture={handleScroll}>
        <div className="space-y-4">
          {/* Loading indicator for more messages */}
          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <div className="text-sm text-gray-500">Đang tải thêm tin nhắn...</div>
            </div>
          )}
          
          {!hasMore && conversationMessages.length > 20 && (
            <div className="flex justify-center py-2">
              <div className="text-sm text-gray-400">Đã tải hết tin nhắn</div>
            </div>
          )}
          
          {timeline.map((item, idx) => {
            // Render Call History Item
            if (item.type === 'call') {
              return (
                <CallHistoryItem
                  key={`call-${item.data.idCall || idx}`}
                  call={item.data}
                  currentUserId={user?.id || user?.idUser}
                  otherUser={
                    conversation.type === 'private'
                      ? conversation.partner
                      : { name: 'Unknown', avatarUrl: '' }
                  }
                />
              );
            }

            // Render Message Item
            const msg = item.data;
            const currentUserId = user?.idUser || user?.id;
            const messageUserId = msg.sender?.idUser || msg.sender?.id;
            const isOwn = currentUserId && messageUserId && (currentUserId === messageUserId);
   

            const isEditing = editingMessage === msg.idMessage;

            return (
              <div
                key={`message-${msg.idMessage}`}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwn && (
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarImage src={getAvatarUrl(msg.sender?.avatarUrl)} />
                      <AvatarFallback>
                        {msg.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && conversation.type === 'group' && (
                      <span className="text-xs text-gray-500 mb-1 px-3">
                        {msg.sender?.name}
                      </span>
                    )}

                    <div
                      className={`relative group px-4 py-2 rounded-2xl max-w-full ${
                        isOwn
                          ? 'text-white shadow-md'
                          : 'bg-gray-100 text-gray-900 border border-gray-200'
                      } ${msg.isDeleted ? 'opacity-50 italic' : ''}`}
                      style={isOwn ? {
                        background: 'linear-gradient(135deg, #0084ff 0%, #0066cc 100%)',
                        borderRadius: '18px 18px 4px 18px'
                      } : {
                        background: '#f1f3f4',
                        borderRadius: '18px 18px 18px 4px'
                      }}
                    >
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="text-sm bg-white text-gray-900"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(msg.idMessage)}
                            className="bg-white text-gray-900 hover:bg-gray-100"
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
                            <span className={`text-xs mt-1 block ${
                              isOwn ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              (đã chỉnh sửa)
                            </span>
                          )}
                        </>
                      )}

                      {/* Message actions */}
                      {isOwn && !msg.isDeleted && !isEditing && (
                        <div className={`absolute top-0 ${isOwn ? 'left-0 -ml-8' : 'right-0 -mr-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-6 h-6 p-0 hover:bg-gray-200">
                                <MoreVertical className="w-3 h-3 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditMessage(msg)}>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteMessage(msg.idMessage)}
                                className="text-red-600 focus:text-red-600"
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
                        {formatTimeAgo(msg.createdAt)}
                      </span>
                      
                      {isOwn && !msg.isDeleted && (
                        <div className="flex items-center">
                          {msg.isRead ? (
                            <CheckCheck className="w-3 h-3 text-blue-500" title="Đã đọc" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" title="Đã gửi" />
                          )}
                        </div>
                      )}
                    </div>
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
                  <AvatarImage src={getAvatarUrl(conversation.partner?.avatarUrl)} />
                  <AvatarFallback>
                    {conversation.partner?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-2xl px-4 py-2" style={{ borderRadius: '18px 18px 18px 4px' }}>
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
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Nhập tin nhắn..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="pr-10 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              style={{ borderRadius: '20px' }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 p-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              background: message.trim() 
                ? 'linear-gradient(135deg, #0084ff 0%, #0066cc 100%)' 
                : undefined 
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Group Settings Dialog */}
      {conversation.type === 'group' && (
        <GroupSettingsDialog
          open={showGroupSettings}
          onClose={() => {
            setShowGroupSettings(false);
          }}
          group={conversation.group}
        />
      )}
    </div>
  );
};