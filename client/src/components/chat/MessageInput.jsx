// src/components/chat/MessageInput.jsx
import { useState, useRef } from 'react';
import  Button  from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send } from 'lucide-react';
import useChatStore from '@/zustand/chatStore';
import useWebSocket from '@/hooks/useWebSocket';
import { messageService } from '@/services/message.service';
import { sendMessageSchema } from '@/schemas/messageSchemas';

const MessageInput = () => {
  const {
    currentConversation,
    currentGroup,
    selectedChatType,
    addMessage
  } = useChatStore();

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);
  const { sendTyping } = useWebSocket();

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    if (!currentConversation && !currentGroup) return;

    try {
      // Validate message
      const validatedData = sendMessageSchema.parse({
        content: message.trim(),
        type: 'TEXT'
      });

      setIsSending(true);
      let response;

      if (selectedChatType === 'private' && currentConversation) {
        response = await messageService.sendPrivateMessage({
          receiverId: currentConversation.friendId,
          ...validatedData
        });
      } else if (selectedChatType === 'group' && currentGroup) {
        response = await messageService.sendGroupMessage({
          groupId: currentGroup.idGroup,
          ...validatedData
        });
      }

      if (response) {
        // Message will be added via WebSocket, but add locally for immediate feedback
        addMessage(response.data);
        setMessage('');
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle validation errors or network errors
      if (error.issues) {
        console.error('Validation errors:', error.issues);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Send typing indicator for private chats
    if (selectedChatType === 'private' && currentConversation) {
      sendTyping(currentConversation.friendId, e.target.value.length > 0);
    }
  };

  if (!currentConversation && !currentGroup) {
    return null;
  }

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={isSending}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;