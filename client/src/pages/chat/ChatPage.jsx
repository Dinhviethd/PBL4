import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConversationList } from './components/ConversationList';
import { ChatArea } from './components/ChatArea';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import useChatStore from '@/zustand/chatStore';
import useWebRTC from '@/hooks/useWebRTC';
import useCallSignaling from '@/hooks/useCallSignaling';
import { IncomingCallModal } from '@/components/call/IncomingCallModal';
import { killAllMedia } from '@/lib/mediaCleanup';

const ChatPage = () => {
  const navigate = useNavigate();

  const {
    activeConversation,
    loadInitialData,
    selectGroupById
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

  // Listen for callEnded event and cleanup WebRTC in ChatPage context
  useEffect(() => {
    const handler = () => {
      console.log('   📱 ChatPage: callEnded event received, cleaning up WebRTC in ChatPage');
      // Force cleanup ChatPage's own WebRTC hook
      if (webRTC && typeof webRTC.closePeerConnection === 'function') {
        webRTC.closePeerConnection();
      }
      if (webRTC && typeof webRTC.stopLocalStream === 'function') {
        webRTC.stopLocalStream();
      }
      try { killAllMedia(); } catch { /* ignore */ }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('callEnded', handler);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('callEnded', handler);
      }
    };
  }, [webRTC]);

  // Check if there's a selectedGroupId to load and select it
  useEffect(() => {
    const selectedGroupId = sessionStorage.getItem('selectedGroupId');
    if (selectedGroupId) {
      const groupIdNum = parseInt(selectedGroupId);
      selectGroupById(groupIdNum);
      sessionStorage.removeItem('selectedGroupId');
    }
  }, [selectGroupById]);

  const handleCreateGroup = () => {
    // TODO: Implement group creation
  };

  // Handle accept incoming call
  const handleAcceptIncomingCall = () => {
    if (callInfo && callInfo.callId) {
      acceptCall(callInfo.callId, callInfo.fromUserId);
      
      // Navigate to CallPage
      sessionStorage.setItem('callSettings', JSON.stringify({
        cameraEnabled: true,
        micEnabled: true
      }));
      navigate('/call');
    }
  };

  // Handle decline incoming call
  const handleDeclineIncomingCall = () => {
    if (callInfo && callInfo.callId) {
      declineCall(callInfo.callId, callInfo.fromUserId);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Incoming Call Modal */}
      {callInfo && (
        <IncomingCallModal
          callInfo={callInfo}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
          autoRejectTime={45}
        />
      )}

      {/* Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
        <ConversationList 
          onCreateGroup={handleCreateGroup}
          onAddMember={() => {}} // Không cần nữa vì đã có trong GroupSettingsDialog
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {activeConversation ? (
          <ChatArea conversation={activeConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center px-8"
            >
              {/* Animated Icon Container */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200
                }}
                className="relative mx-auto mb-8"
                style={{ width: '160px', height: '160px' }}
              >
                {/* Animated Background Circles */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.1, 0.3]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full blur-2xl"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.05, 0.2]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-cyan-300 to-sky-400 rounded-full blur-3xl"
                />
                
                {/* Main Icon Container */}
                <motion.div 
                  animate={{ 
                    y: [0, -10, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative w-full h-full bg-gradient-to-br from-blue-400 via-cyan-400 to-sky-400 rounded-full flex items-center justify-center shadow-2xl"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <MessageCircle className="w-20 h-20 text-white" strokeWidth={1.5} />
                  </motion.div>
                  
                  {/* Floating dots */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeInOut"
                      }}
                      className="absolute bottom-0 w-2 h-2 bg-white rounded-full"
                      style={{ left: `${35 + i * 15}%` }}
                    />
                  ))}
                </motion.div>
              </motion.div>

              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent mb-3">
                  Chọn một cuộc trò chuyện
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                  Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
                </p>
              </motion.div>

              {/* Decorative Elements */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mt-8 flex items-center justify-center gap-2"
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ChatPage;