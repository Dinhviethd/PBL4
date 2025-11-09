import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConversationList } from './components/ConversationList';
import { ChatArea } from './components/ChatArea';
import { MessageCircle } from 'lucide-react';
import useChatStore from '@/zustand/chatStore';
import useWebRTC from '@/hooks/useWebRTC';
import useCallSignaling from '@/hooks/useCallSignaling';
import { IncomingCallModal } from '@/components/call/IncomingCallModal';

const ChatPage = () => {
  const navigate = useNavigate();

  const {
    activeConversation,
    loadInitialData
  } = useChatStore();

  // Initialize WebRTC and Signaling
  const webRTC = useWebRTC('audio');
  const {
    callInfo,
    acceptCall,
    declineCall
  } = useCallSignaling(webRTC);

  // Load initial data when component mounts
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleCreateGroup = () => {
    // TODO: Implement group creation
  };

  // Handle accept incoming call
  const handleAcceptIncomingCall = () => {
    if (callInfo && callInfo.callId) {
      console.log('✅ Accepting call:', callInfo.callId);
      acceptCall(callInfo.callId, callInfo.fromUserId);
      
      // Navigate to CallPage
      sessionStorage.setItem('callSettings', JSON.stringify({
        cameraEnabled: false,
        micEnabled: true
      }));
      navigate('/call');
    }
  };

  // Handle decline incoming call
  const handleDeclineIncomingCall = () => {
    if (callInfo && callInfo.callId) {
      console.log('❌ Declining call:', callInfo.callId);
      declineCall(callInfo.callId, callInfo.fromUserId);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Incoming Call Modal */}
      {callInfo && (
        <IncomingCallModal
          callInfo={callInfo}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
          autoRejectTime={10}
        />
      )}

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