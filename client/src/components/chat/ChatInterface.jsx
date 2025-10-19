import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import useWebSocket from '@/hooks/useWebSocket';

const ChatInterface = () => {
  useWebSocket();

  return (
    <div className="h-screen flex bg-gray-50">
      <ConversationList />
      <div className="flex-1 flex flex-col">
        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatInterface;