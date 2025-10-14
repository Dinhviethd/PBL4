// src/components/chat/MessageList.jsx
import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/ScrollArea';
import Button from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import useChatStore from '@/zustand/chatStore';
import useAuthStore from '@/zustand/authStore';
import { messageService } from '@/services/message.service';

const MessageList = () => {
  const {
    currentConversation,
    currentGroup,
    selectedChatType,
    messages,
    hasMoreMessages,
    isLoadingMessages,
    setMessages,
    prependMessages,
    setLoadingMessages
  } = useChatStore();

  const { user } = useAuthStore();
  const scrollAreaRef = useRef(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  useEffect(() => {
    if (currentConversation || currentGroup) {
      loadMessages();
    }
  }, [currentConversation, currentGroup]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!currentConversation && !currentGroup) return;

    setLoadingMessages(true);
    try {
      let response;
      if (selectedChatType === 'private' && currentConversation) {
        response = await messageService.getPrivateMessages(currentConversation.friendId);
      } else if (selectedChatType === 'group' && currentGroup) {
        response = await messageService.getGroupMessages(currentGroup.idGroup);
      }

      if (response) {
        setMessages(
          response.data || [], 
          response.pagination.currentPage < response.pagination.totalPages
        );
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!hasMoreMessages || isLoadingOlder || messages.length === 0) return;

    setIsLoadingOlder(true);
    try {
      const oldestMessage = messages[0];
      let response;

      if (selectedChatType === 'private' && currentConversation) {
        response = await messageService.getOlderPrivateMessages(
          currentConversation.friendId,
          oldestMessage.idMessage
        );
      } else if (selectedChatType === 'group' && currentGroup) {
        response = await messageService.getOlderGroupMessages(
          currentGroup.idGroup,
          oldestMessage.idMessage
        );
      }

      if (response && response.data.length > 0) {
        prependMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to load older messages:', error);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const isMyMessage = (message) => {
    return message.sentBy.idUser === user?.userId;
  };

  if (!currentConversation && !currentGroup) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-500">
            Choose a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage 
              src={currentConversation?.avatarUrl || currentGroup?.avatarUrl} 
            />
            <AvatarFallback>
              {(currentConversation?.name || currentGroup?.name)?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentConversation?.name || currentGroup?.name}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedChatType === 'group' ? 'Group chat' : 'Private chat'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {hasMoreMessages && (
          <div className="text-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadOlderMessages}
              disabled={isLoadingOlder}
            >
              {isLoadingOlder ? 'Loading...' : 'Load older messages'}
            </Button>
          </div>
        )}

        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.idMessage}
                className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                  isMyMessage(message) ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {!isMyMessage(message) && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.sentBy.avatarUrl} />
                      <AvatarFallback>
                        {message.sentBy.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isMyMessage(message)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {!isMyMessage(message) && selectedChatType === 'group' && (
                        <p className="text-xs font-medium mb-1 opacity-75">
                          {message.sentBy.name}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default MessageList;