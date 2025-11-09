import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '@/zustand/chatStore';
import useAuthStore from '@/zustand/authStore';
import callService from '@/services/call.service';
import { useNotification } from '@/hooks/useNotification';

/**
 * Hook quản lý WebRTC Signaling qua WebSocket
 * Xử lý các thông điệp offer, answer, ICE candidates
 */
const useCallSignaling = (webRTC) => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  const { socket, activeCall, setActiveCall } = useChatStore();
  const { user } = useAuthStore();
  
  const [signalingState, setSignalingState] = useState('idle'); // idle, initiating, ringing, connected
  const [callInfo, setCallInfo] = useState(null);
  const [error, setError] = useState(null);
  
  const iceCandidatesQueueRef = useRef([]);
  const remoteDescriptionSetRef = useRef(false);
  const autoRejectTimeoutRef = useRef(null); // For auto-reject incoming calls
  const answerRef = useRef(null); // Store created answer to avoid recreating

  /**
   * Tự động từ chối cuộc gọi sau 10s nếu không có tương tác
   */
  const setupAutoReject = useCallback((callId, toUserId, declineFunc) => {
    // Clear existing timeout if any
    if (autoRejectTimeoutRef.current) {
      clearTimeout(autoRejectTimeoutRef.current);
    }

    // Set new timeout for auto-reject (10 seconds)
    autoRejectTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Auto-rejecting call after 10s timeout');
      declineFunc(callId, toUserId);
    }, 10000);
  }, []);

  /**
   * Clear auto-reject timeout
   */
  const clearAutoReject = useCallback(() => {
    if (autoRejectTimeoutRef.current) {
      clearTimeout(autoRejectTimeoutRef.current);
      autoRejectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Gửi message qua WebSocket
   */
  const sendSignalingMessage = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return true;
    }
    console.error('WebSocket not connected');
    return false;
  }, [socket]);

  /**
   * Khởi tạo cuộc gọi (Caller)
   */
  const initiateCall = useCallback(async (toUserId, callType = 'audio') => {
    try {
      setSignalingState('initiating');
      setCallInfo({ toUserId, callType, fromUserId: user.idUser });

      // Gửi thông báo khởi tạo cuộc gọi
      sendSignalingMessage({
        type: 'CALL_INITIATE',
        toUserId,
        callType
      });

    } catch (err) {
      console.error('Error initiating call:', err);
      setError(err.message);
      setSignalingState('idle');
    }
  }, [user, sendSignalingMessage]);

  /**
   * Gửi SDP Offer
   */
  const sendOffer = useCallback(async (callId, toUserId) => {
    try {
      if (!webRTC || !webRTC.createOffer) {
        throw new Error('WebRTC not initialized');
      }

      const offer = await webRTC.createOffer();
      
      sendSignalingMessage({
        type: 'CALL_OFFER',
        callId,
        toUserId,
        offer: offer
      });

      setSignalingState('ringing');
    } catch (err) {
      console.error('Error sending offer:', err);
      setError(err.message);
    }
  }, [webRTC, sendSignalingMessage]);

  /**
   * Gửi SDP Answer
   */
  const sendAnswer = useCallback(async (callId, toUserId) => {
    try {
      if (!answerRef.current) {
        throw new Error('Answer not created yet');
      }

      const answer = answerRef.current;
      
      console.log(`✅ Sending CALL_ANSWER: {callId: ${callId}, toUserId: ${toUserId}}`);
      sendSignalingMessage({
        type: 'CALL_ANSWER',
        callId,
        toUserId,
        answer: answer
      });

      console.log('✅ SDP Answer sent!');
      
      // Clear the stored answer after sending
      answerRef.current = null;

      // Lưu call vào database với trạng thái ONGOING
      await callService.getCall(callId);

    } catch (err) {
      console.error('Error sending answer:', err);
      setError(err.message);
    }
  }, [sendSignalingMessage]);

  /**
   * Gửi ICE Candidate
   */
  const sendIceCandidate = useCallback((callId, toUserId, candidate) => {
    sendSignalingMessage({
      type: 'CALL_ICE_CANDIDATE',
      callId,
      toUserId,
      candidate: candidate
    });
  }, [sendSignalingMessage]);

  /**
   * Chấp nhận cuộc gọi (Callee)
   */
  const acceptCall = useCallback((callId, toUserId) => {
    try {
      console.log(`\n✅ acceptCall() function called:`);
      console.log(`   callId: ${callId}`);
      console.log(`   toUserId (caller): ${toUserId}`);
      console.log(`   Current activeCall from store:`, activeCall);
      console.log(`   Current callInfo:`, callInfo);
      
      // 🔐 Guard: Set activeCall if not already set
      // This is critical for Caller to send SDP Offer on CALL_ACCEPT
      if (!activeCall || !activeCall.idCall) {
        console.log('   ⚠️  activeCall not set, creating from callId/toUserId...');
        // ✅ Get callType from callInfo (sent by caller in CALL_INITIATE)
        const newActiveCall = {
          idCall: callId,
          toUserId: toUserId, // Caller's ID
          callType: callInfo?.callType || 'audio', // Use callType from CALL_INITIATE
          status: 'accepted'
        };
        setActiveCall(newActiveCall);
        console.log('   ✅ Set activeCall:', newActiveCall);
      } else {
        console.log('   ✅ activeCall already exists, updating status...');
        const updatedActiveCall = { ...activeCall, status: 'accepted' };
        setActiveCall(updatedActiveCall);
        console.log('   ✅ Updated activeCall.status to "accepted":', updatedActiveCall);
      }
      
      setSignalingState('connected');
      console.log('   ✅ Set signalingState to "connected"');
      
      // Send accept signal to caller
      console.log(`   📤 Sending CALL_ACCEPT message...`);
      const sent = sendSignalingMessage({
        type: 'CALL_ACCEPT',
        callId,
        toUserId
      });
      console.log(`   ✅ CALL_ACCEPT message sent: ${sent}`);

      // Navigate to CallPage for video/audio
      console.log('   📱 Scheduling navigation to CallPage (300ms delay)');
      setTimeout(() => {
        console.log('   📱 Navigating to CallPage now...');
        navigate('/call', { 
          state: { 
            callId, 
            callType: 'video'
          } 
        });
      }, 300);

    } catch (err) {
      console.error('❌ Error accepting call:', err);
      showError('Lỗi', 'Không thể chấp nhận cuộc gọi');
      setError(err.message);
    }
  }, [sendSignalingMessage, navigate, showError, activeCall, setActiveCall, callInfo]);

  /**
   * Từ chối cuộc gọi
   * @param {number} callId - ID của cuộc gọi
   * @param {number} callerId - ID của người gọi (cần gửi DECLINE về cho họ)
   */
  const declineCall = useCallback((callId, callerId) => {
    try {
      console.log(`📞 Declining call ${callId}, sending to caller ${callerId}`);
      setSignalingState('idle');
      sendSignalingMessage({
        type: 'CALL_DECLINE',
        callId,
        toUserId: callerId  // Gửi về cho người gọi
      });
      
      if (webRTC && webRTC.closePeerConnection) {
        webRTC.closePeerConnection();
      }
    } catch (err) {
      console.error('Error declining call:', err);
    }
  }, [webRTC, sendSignalingMessage]);

  /**
   * Kết thúc cuộc gọi
   */
  const endCall = useCallback((callId, toUserId) => {
    try {
      setSignalingState('idle');
      sendSignalingMessage({
        type: 'CALL_END',
        callId,
        toUserId
      });

      if (webRTC && webRTC.closePeerConnection) {
        webRTC.closePeerConnection();
      }
    } catch (err) {
      console.error('Error ending call:', err);
    }
  }, [webRTC, sendSignalingMessage]);

  /**
   * Xử lý incoming offer
   */
  const handleIncomingOffer = useCallback(async (data) => {
    try {
      if (!webRTC) throw new Error('WebRTC not initialized');

      console.log('📞 Processing incoming OFFER from caller...');
      console.log('   callId:', data.callId);
      console.log('   fromUserId:', data.fromUserId);

      // Set remote description (offer từ caller)
      await webRTC.setRemoteDescription(data.offer);
      remoteDescriptionSetRef.current = true;
      console.log('   ✅ Remote description (offer) set');

      // Process queued ICE candidates
      for (const candidate of iceCandidatesQueueRef.current) {
        await webRTC.addIceCandidate(candidate);
      }
      iceCandidatesQueueRef.current = [];

      // Save callId for later use
      setCallInfo(prev => ({
        ...prev,
        callId: data.callId
      }));

      // 🔐 Guard: Create and store ANSWER if we have webRTC initialized
      // Callee must respond with answer to complete SDP exchange
      if (webRTC && data.callId && data.fromUserId) {
        console.log('   📤 Scheduling CALL_ANSWER in 300ms...');
        setTimeout(async () => {
          console.log('   📤 NOW creating ANSWER...');
          try {
            // ✅ Create answer and store it for sending
            const answer = await webRTC.createAnswer();
            answerRef.current = answer;
            console.log('   ✅ ANSWER created and stored');
            
            // Now send it
            console.log('   📤 Sending CALL_ANSWER to caller...');
            sendAnswer(data.callId, data.fromUserId);
          } catch (err) {
            console.error('   ❌ Error creating answer:', err);
          }
        }, 300);
      }

    } catch (err) {
      console.error('Error handling incoming offer:', err);
      setError(err.message);
    }
  }, [webRTC, sendAnswer]);

  /**
   * Xử lý incoming answer
   */
  const handleIncomingAnswer = useCallback(async (data) => {
    try {
      if (!webRTC) throw new Error('WebRTC not initialized');

      // Set remote description (answer từ callee)
      await webRTC.setRemoteDescription(data.answer);
      remoteDescriptionSetRef.current = true;

      // Process queued ICE candidates
      for (const candidate of iceCandidatesQueueRef.current) {
        await webRTC.addIceCandidate(candidate);
      }
      iceCandidatesQueueRef.current = [];

      setSignalingState('connected');

    } catch (err) {
      console.error('Error handling incoming answer:', err);
      setError(err.message);
    }
  }, [webRTC]);

  /**
   * Xử lý incoming ICE candidate
   */
  const handleIncomingIceCandidate = useCallback(async (data) => {
    try {
      if (!webRTC) throw new Error('WebRTC not initialized');

      if (!remoteDescriptionSetRef.current) {
        // Queue ICE candidates nếu chưa set remote description
        iceCandidatesQueueRef.current.push(data.candidate);
        return;
      }

      await webRTC.addIceCandidate(data.candidate);

    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }, [webRTC]);

  /**
   * Xử lý các signaling messages từ WebSocket
   */
  const handleSignalingMessage = useCallback((data) => {
    const { type } = data;
    console.log(`📞 [Signaling] Received ${type} message:`, data);

    switch (type) {
      case 'CALL_INITIATE_RESPONSE': {
        // Response từ backend xác nhận call đã được tạo
        console.log('✅ Call initiated successfully, waiting for peer response...');
        console.log('   Received callId from backend:', data.data.callId);
        console.log('   Received toUserId from backend:', data.data.toUserId);
        
        // 🔐 Guard: Set callId từ backend vào callInfo để chuẩn bị gửi offer
        if (data.data.callId) {
          setCallInfo(prev => ({
            ...prev,
            callId: data.data.callId,
            toUserId: data.data.toUserId // Also save toUserId (callee's ID)
          }));
          console.log('   ✅ Set callId in callInfo for later SDP Offer:', data.data.callId);
          
          // ✅ Also update activeCall with callId and toUserId so we can end call early if needed
          if (activeCall) {
            const updatedActiveCall = {
              ...activeCall,
              idCall: data.data.callId,
              toUserId: data.data.toUserId
            };
            setActiveCall(updatedActiveCall);
            console.log('   ✅ Updated activeCall with idCall and toUserId:', updatedActiveCall);
          }
        } else {
          console.warn('   ⚠️  No callId in CALL_INITIATE_RESPONSE');
        }
        
        setSignalingState('ringing'); // Caller waiting for callee
        break;
      }

      case 'CALL_INITIATE': {
        // Incoming call initiation
        const callData = {
          callId: data.data.callId,
          callType: data.data.callType,
          fromUserId: data.data.fromUserId,
          caller: data.data.caller
        };
        setCallInfo(callData);
        setSignalingState('ringing');
        
        // Setup auto-reject after 10 seconds
        // Note: will be handled by IncomingCallModal countdown, 
        // but this ensures server-side auto-reject as well
        console.log('📞 Incoming call detected, starting auto-reject timer');
        break;
      }

      case 'CALL_OFFER':
        // Incoming offer từ caller
        console.log('📞 Handling incoming offer from caller...');
        setSignalingState('connected'); // Callee knows connection is being established
        handleIncomingOffer(data.data);
        break;

      case 'CALL_ANSWER':
        // Incoming answer từ callee
        handleIncomingAnswer(data.data);
        break;

      case 'CALL_ICE_CANDIDATE':
        // Incoming ICE candidate
        handleIncomingIceCandidate(data.data);
        break;

      case 'CALL_ACCEPT': {
        // Callee accepted call
        console.log('\n✅ CALL_ACCEPT received - Callee accepted the call');
        console.log('   Received data:', data);
        console.log('   data.data.callId:', data.data?.callId);
        console.log('   data.data.fromUserId:', data.data?.fromUserId);
        console.log('   Local callInfo state:', callInfo);
        console.log('   activeCall from store:', activeCall);
        console.log('   webRTC state:', webRTC ? 'initialized' : 'NOT initialized');
        
        setSignalingState('connected');
        console.log('   ✅ Set signalingState to "connected"');
        
        // Extract callId and calleeId from response
        const callIdFromData = data.data?.callId;
        const calleeIdFromData = data.data?.fromUserId;
        
        // 🔐 Guard: Update activeCall with idCall, toUserId, and status
        if (activeCall) {
          const updatedActiveCall = { 
            ...activeCall, 
            idCall: callIdFromData, // ✅ Set idCall from backend
            toUserId: calleeIdFromData, // ✅ Set toUserId (callee's ID)
            status: 'accepted' 
          };
          setActiveCall(updatedActiveCall);
          console.log('   ✅ Updated activeCall with idCall and status:', updatedActiveCall);
        }
        
        const callId = activeCall?.idCall || callIdFromData;
        const calleeId = calleeIdFromData;
        
        console.log('   📦 Preparing to send SDP Offer:');
        console.log(`      callId (from activeCall.idCall or data.data.callId): ${callId}`);
        console.log(`      calleeId (from data.data.fromUserId): ${calleeId}`);
        console.log(`      webRTC: ${!!webRTC}`);
        
        if (callId && calleeId && webRTC) {
          console.log(`   ✅ All conditions met!`);
          console.log(`      Sending SDP Offer in 300ms...`);
          
          // Use arrow function to capture current values
          setTimeout(() => {
            console.log('      📤 NOW sending SDP Offer...');
            webRTC.createOffer().then(offer => {
              sendSignalingMessage({
                type: 'CALL_OFFER',
                callId,
                toUserId: calleeId,
                offer
              });
              console.log('      ✅ SDP Offer sent!');
            }).catch(err => {
              console.error('      ❌ Error creating offer:', err);
            });
          }, 300);
        } else {
          console.warn('   ❌ Missing data:', { callId, calleeId, webRTC: !!webRTC });
          console.log('   data.data:', data.data);
        }
        break;
      }

      case 'CALL_DECLINE':
        // Callee declined call
        console.log('❌ CALL_DECLINE received - Callee declined the call');
        showError('Thông báo', 'Cuộc gọi đã bị từ chối');
        setSignalingState('idle');
        setCallInfo(null);
        if (webRTC && webRTC.closePeerConnection) {
          webRTC.closePeerConnection();
        }
        // Navigate back to chat
        setTimeout(() => {
          navigate(-1);
        }, 300);
        break;

      case 'CALL_END':
        // Call ended by peer - can happen at any stage (ringing or connected)
        console.log('🛑 CALL_END received - Call ended by peer');
        console.log('   Current signalingState:', signalingState);
        
        setSignalingState('idle');
        setCallInfo(null);
        // ✅ Clear activeCall when peer ends the call
        setActiveCall(null);
        
        // Close WebRTC if it exists
        if (webRTC && webRTC.closePeerConnection) {
          webRTC.closePeerConnection();
        }
        
        // ✅ Navigate back to home to close CallPage/popup
        console.log('📱 Navigating away from call page...');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 300);
        break;

      case 'CALL_ERROR':
        // Error in call
        setError(data.data.error);
        setSignalingState('idle');
        break;

      default:
        break;
    }
  }, [handleIncomingOffer, handleIncomingAnswer, handleIncomingIceCandidate, webRTC, navigate, showError, callInfo, activeCall, setActiveCall, sendSignalingMessage, signalingState]);

  /**
   * Setup WebSocket listeners
   */
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle signaling messages
        if (data.type && data.type.startsWith('CALL_')) {
          handleSignalingMessage(data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, handleSignalingMessage]);

  /**
   * Handle ICE candidate events from WebRTC
   */
  useEffect(() => {
    const handleIceCandidate = (event) => {
      if (!event.detail) return;

      // ✅ Use activeCall from store (persistent) instead of callInfo (transient)
      const callId = activeCall?.idCall || callInfo?.callId;
      const toUserId = activeCall?.toUserId || callInfo?.toUserId || activeCall?.fromUserId || callInfo?.fromUserId;

      if (callId && toUserId && event.detail) {
        console.log(`🧊 Sending ICE candidate to peer (callId: ${callId}, toUserId: ${toUserId})`);
        sendIceCandidate(callId, toUserId, event.detail);
      }
    };

    window.addEventListener('iceCandidate', handleIceCandidate);

    return () => {
      window.removeEventListener('iceCandidate', handleIceCandidate);
    };
  }, [callInfo, activeCall, sendIceCandidate]);

  return {
    signalingState,
    callInfo,
    error,
    initiateCall,
    sendOffer,
    sendAnswer,
    acceptCall,
    declineCall,
    endCall,
    handleSignalingMessage,
    setupAutoReject,
    clearAutoReject
  };
};

export default useCallSignaling;
