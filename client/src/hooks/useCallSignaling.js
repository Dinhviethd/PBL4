import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '@/zustand/chatStore';
import useAuthStore from '@/zustand/authStore';
import callService from '@/services/call.service';
import { useNotification } from '@/hooks/useNotification';


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
  const autoRejectTimeoutRef = useRef(null); 
  const answerRef = useRef(null); // Store created answer to avoid recreating


  const setupAutoReject = useCallback((callId, toUserId, declineFunc) => {
    if (autoRejectTimeoutRef.current) {
      clearTimeout(autoRejectTimeoutRef.current);
    }

    autoRejectTimeoutRef.current = setTimeout(() => {
      declineFunc(callId, toUserId);
    }, 20000);
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
      
      sendSignalingMessage({
        type: 'CALL_ANSWER',
        callId,
        toUserId,
        answer: answer
      });

      answerRef.current = null;

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
      if (!activeCall || !activeCall.idCall) {
        const newActiveCall = {
          idCall: callId,
          toUserId: toUserId, // Caller's ID
          callType: callInfo?.callType || 'audio', // Use callType from CALL_INITIATE
          status: 'accepted'
        };
        setActiveCall(newActiveCall);
      } else {
        const updatedActiveCall = { ...activeCall, status: 'accepted' };
        setActiveCall(updatedActiveCall);
      }
      
      setSignalingState('connected');
      
      // Send accept signal to caller
      sendSignalingMessage({
        type: 'CALL_ACCEPT',
        callId,
        toUserId
      });

      // Navigate to CallPage for video/audio
      setTimeout(() => {
        navigate('/call', { 
          state: { 
            callId, 
            callType: 'video'
          } 
        });
      }, 300);

    } catch (err) {
      console.error('Error accepting call:', err);
      showError('Lỗi', 'Không thể chấp nhận cuộc gọi');
      setError(err.message);
    }
  }, [sendSignalingMessage, navigate, showError, activeCall, setActiveCall, callInfo]);

  const declineCall = useCallback((callId, callerId) => {
    try {
      setTimeout(() => {
        if (webRTC && webRTC.closePeerConnection) {
          webRTC.closePeerConnection();
        }

        setSignalingState('idle');
        setCallInfo(null);

        // Gửi cho người gọi
        sendSignalingMessage({
          type: 'CALL_DECLINE',
          callId,
          toUserId: callerId
        });

        // Gửi cho người nhận (callee)
        if (user && user.idUser) {
          sendSignalingMessage({
            type: 'CALL_DECLINE',
            callId,
            toUserId: user.idUser
          });
          console.log(user.idUser)
        }
      }, 0);
    } catch (err) {
      console.error('Error declining call:', err);
    }
  }, [webRTC, sendSignalingMessage, user]);

  /**
   * Kết thúc cuộc gọi
   */
  const endCall = useCallback((callId, toUserId) => {
    try {
      setSignalingState('idle');
      console.log(" tatw may", toUserId)
      sendSignalingMessage({
        type: 'CALL_END',
        callId,
        toUserId
      });

      // Dispatch a global event so any mounted WebRTC hooks can cleanup
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('callEnded', { detail: { callId, toUserId } }));
        }
      } catch (e) {
        console.warn('Could not dispatch callEnded event:', e);
      }

      // Clear activeCall from zustand so components react
      setActiveCall(null);

      // Use setTimeout to avoid nested state updates warning
      setTimeout(() => {
        if (webRTC && webRTC.closePeerConnection) {
          webRTC.closePeerConnection();
        }
      }, 0);
    } catch (err) {
      console.error('Error ending call:', err);
    }
  }, [webRTC, sendSignalingMessage, setActiveCall]);

  /**
   * Xử lý incoming offer
   */
  const handleIncomingOffer = useCallback(async (data) => {
    try {
      if (!webRTC) throw new Error('WebRTC not initialized');

      // Set remote description (offer từ caller)
      await webRTC.setRemoteDescription(data.offer);
      remoteDescriptionSetRef.current = true;

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

      // Callee must respond with answer to complete SDP exchange
      if (webRTC && data.callId && data.fromUserId) {
        setTimeout(async () => {
          try {
            const answer = await webRTC.createAnswer();
            answerRef.current = answer;
            sendAnswer(data.callId, data.fromUserId);
          } catch (err) {
            console.error('Error creating answer:', err);
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

    switch (type) {
      case 'CALL_INITIATE_RESPONSE': {
      if (data.data.callId) {
          setCallInfo(prev => ({
            ...prev,
            callId: data.data.callId,
            toUserId: data.data.toUserId // Also save toUserId (callee's ID)
          }));
          if (activeCall) {
            const updatedActiveCall = {
              ...activeCall,
              idCall: data.data.callId,
              toUserId: data.data.toUserId
            };
            setActiveCall(updatedActiveCall);
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
        setSignalingState('connected');
        console.log('   ✅ Set signalingState to "connected"');
        
        // Extract callId and calleeId from response
        const callIdFromData = data.data?.callId;
        const calleeIdFromData = data.data?.fromUserId;
        
        if (activeCall) {
          const updatedActiveCall = { 
            ...activeCall, 
            idCall: callIdFromData, 
            toUserId: calleeIdFromData, 
            status: 'accepted' 
          };
          setActiveCall(updatedActiveCall);
        }
        
        const callId = activeCall?.idCall || callIdFromData;
        const calleeId = calleeIdFromData;
        
        if (callId && calleeId && webRTC) {          
          // Use arrow function to capture current values
          setTimeout(() => {
            webRTC.createOffer().then(offer => {
              sendSignalingMessage({
                type: 'CALL_OFFER',
                callId,
                toUserId: calleeId,
                offer
              });
            }).catch(err => {
              console.error('Error creating offer:', err);
            });
          }, 300);
        } else {
          console.warn('Missing data:', { callId, calleeId, webRTC: !!webRTC });
        }
        break;
      }

      case 'CALL_DECLINE':
        // Callee declined call
        showError('Thông báo', 'Cuộc gọi đã bị từ chối');
        
        if (webRTC && webRTC.closePeerConnection) {
          webRTC.closePeerConnection();
        }
        
        setSignalingState('idle');
        
        setCallInfo(null);
        console.log('   ✅ Clearing callInfo');
        
        // Navigate back to chat
        console.log('   📱 Scheduling navigation back to chat...');
        setTimeout(() => {
          console.log('   📱 Navigating back...');
          navigate(-1);
        }, 300);
        break;

      case 'CALL_END': {
        console.log(`🔴 Nhận CALL_END từ peer (callId=${data.data?.callId})`);

        // Immediately close WebRTC first
        if (webRTC && webRTC.closePeerConnection) {
          webRTC.closePeerConnection();
        }

        // Explicitly stop local tracks if available (extra safety)
        if (webRTC && typeof webRTC.stopLocalStream === 'function') {
          try {
            webRTC.stopLocalStream();
          } catch (e) {
            console.warn('Error stopping local stream during CALL_END:', e);
          }
        }

        // Reset WebRTC instance for new calls
        if (webRTC && typeof webRTC.reset === 'function') {
          try {
            webRTC.reset();
          } catch (e) {
            console.warn('Error resetting WebRTC instance:', e);
          }
        }

        // Broadcast a global event so other hook instances also cleanup
        console.log(`📡 Phát sự kiện 'callEnded' cho tất cả hook instances`);
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('callEnded', { detail: { callId: data.data?.callId } }));
          }
        } catch (e) {
          console.warn('Could not dispatch callEnded event:', e);
        }

        // Clear signaling state immediately
        setSignalingState('idle');

        // Clear callInfo immediately - this closes the popup
        setCallInfo(null);

        // Clear activeCall when peer ends the call
        setActiveCall(null);

        // Navigate back to home after a short delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 300);
        break;
      }

      case 'CALL_ERROR':
        // Error in call
        setError(data.data.error);
        setSignalingState('idle');
        break;

      case 'CAMERA_TOGGLE': {
        // Handle camera toggle
        const { userId, isCameraOn } = data.data;
        console.log(`📷 CAMERA_TOGGLE received: userId=${userId}, isCameraOn=${isCameraOn}`);

        if (webRTC && typeof webRTC.updateRemoteStream === 'function') {
          try {
            webRTC.updateRemoteStream(userId, isCameraOn);
          } catch (err) {
            console.error('Error updating remote stream for CAMERA_TOGGLE:', err);
          }
        }
        break;
      }

      default:
        break;
    }
  }, [handleIncomingOffer, handleIncomingAnswer, handleIncomingIceCandidate, webRTC, navigate, showError, activeCall, setActiveCall, sendSignalingMessage]);

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

      const callId = activeCall?.idCall || callInfo?.callId;
      const toUserId = activeCall?.toUserId || callInfo?.toUserId || activeCall?.fromUserId || callInfo?.fromUserId;

      if (callId && toUserId && event.detail) {
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
