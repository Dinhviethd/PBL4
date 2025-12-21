import { useRef, useState, useCallback, useEffect } from 'react';
import { killAllMedia } from '@/lib/mediaCleanup';

const useWebRTC = (callType = 'audio', customLocalVideoRef = null, customRemoteVideoRef = null) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('new');
  
  const peerConnectionRef = useRef(null);
  // Always create internal refs
  const internalLocalVideoRef = useRef(null);
  const internalRemoteVideoRef = useRef(null);
  
  // Use custom refs if provided, otherwise use internal ones
  const localVideoRef = customLocalVideoRef || internalLocalVideoRef;
  const remoteVideoRef = customRemoteVideoRef || internalRemoteVideoRef;
  
  const stunServersRef = useRef([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]);

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    console.log(' Creating RTCPeerConnection...');
    const peerConnection = new RTCPeerConnection({ iceServers: stunServersRef.current });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        window.dispatchEvent(new CustomEvent('iceCandidate', { detail: event.candidate }));
      } 
    };

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current && callType === 'video') {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      setConnectionState(state);
    };

    peerConnection.oniceconnectionstatechange = () => {
    };

    peerConnectionRef.current = peerConnection;
    console.log('RTCPeerConnection created');
    return peerConnection;
  }, [callType, remoteVideoRef]);

  const getLocalStream = useCallback(async () => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video' ? { width: 1280, height: 720 } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (callType === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }, [callType, localVideoRef]);

  const addLocalStreamToPeerConnection = useCallback(async () => {
    try {
      let stream = localStream;
      if (!stream) {
        stream = await getLocalStream();
      }

      const pc = initializePeerConnection();
      
      // CHECK IF TRACKS ALREADY ADDED
      const existingSenders = pc.getSenders();
      const existingTracks = existingSenders.map(sender => sender.track);
      
      stream.getTracks().forEach(track => {
        // Skip if this track already added
        if (existingTracks.some(t => t && t.id === track.id)) {
          return;
        }
        
        pc.addTrack(track, stream);
      });

      return stream;
    } catch (error) {
      console.error(' Error adding local stream:', error);
      throw error;
    }
  }, [localStream, getLocalStream, initializePeerConnection]);

  const createOffer = useCallback(async () => {
    try {
      await addLocalStreamToPeerConnection();
      
      let pc = peerConnectionRef.current;
      if (!pc) {
        pc = initializePeerConnection();
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      });

      await pc.setLocalDescription(offer);
    
      return offer;
    } catch (error) {
      console.error(' Error creating offer:', error);
      throw error;
    }
  }, [addLocalStreamToPeerConnection, callType, initializePeerConnection]);

  const createAnswer = useCallback(async () => {
    try {
      await addLocalStreamToPeerConnection();
      
      let pc = peerConnectionRef.current;
      if (!pc) {
        pc = initializePeerConnection();
      }

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      });

      await pc.setLocalDescription(answer);
      
      return answer;
    } catch (error) {
      console.error(' Error creating answer:', error);
      throw error;
    }
  }, [addLocalStreamToPeerConnection, callType, initializePeerConnection]);

  const setRemoteDescription = useCallback(async (description) => {
    try {
      let pc = peerConnectionRef.current;
      // Auto-initialize if not yet created (handles case where offer arrives before init)
      if (!pc) {
        pc = initializePeerConnection();
      }
      if (!pc) throw new Error('Peer connection not initialized');
      await pc.setRemoteDescription(new RTCSessionDescription(description));
      
    } catch (error) {
      console.error(` Error setting remote description:`, error);
      throw error;
    }
  }, [initializePeerConnection]);

  const addIceCandidate = useCallback(async (candidate) => {
    try {
      let pc = peerConnectionRef.current;
      // Auto-initialize if not yet created
      if (!pc) {
        pc = initializePeerConnection();
      }
      if (!pc) throw new Error('Peer connection not initialized');

      if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, [initializePeerConnection]);

  const stopLocalStream = useCallback(() => {
    
    if (localStream) {
      localStream.getTracks().forEach(track => {
        // Force disable track first
        track.enabled = false;
        // Then stop it
        track.stop();
      });
      setLocalStream(null);
    }
    
    // Extra safety: explicitly clear video element srcObject
    if (localVideoRef?.current) {
      try {
        localVideoRef.current.srcObject = null;
        localVideoRef.current.pause();
      } catch (e) {
        console.warn('Error clearing local video element:', e);
      }
    }
    
    // Try to enumerate and verify devices are released
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
        navigator.mediaDevices.enumerateDevices().then(devices => {
          const audioInputs = devices.filter(device => device.kind === 'audioinput' && device.deviceId !== 'default');
          const videoInputs = devices.filter(device => device.kind === 'videoinput');
          if (audioInputs.length > 0 || videoInputs.length > 0) {
            console.log(`📱 Still-active devices: ${audioInputs.length} audio, ${videoInputs.length} video`);
          }
        });
      }
    } catch {
      // Ignore errors from device enumeration
    }
  }, [localStream, localVideoRef]);

  const closePeerConnection = useCallback(() => {
  try {
    const pc = peerConnectionRef.current;

    if (pc && pc.connectionState !== 'closed') {
      
      // Remove all senders first
      const senders = pc.getSenders();
      senders.forEach((sender, idx) => {
        try {
          if (sender.track) {
            sender.track.enabled = false;
            sender.track.stop();
            pc.removeTrack(sender);
          }
        } catch (e) {
          console.warn(`Error removing sender ${idx}:`, e);
        }
      });
      
      // Also try to remove all receivers
      const receivers = pc.getReceivers();
      receivers.forEach((receiver, idx) => {
        try {
          if (receiver.track) {
            receiver.track.enabled = false;
            receiver.track.stop();
          }
        } catch (e) {
          console.warn(`Error stopping receiver ${idx}:`, e);
        }
      });
      
      pc.close();
      peerConnectionRef.current = null;
      console.log('✅ PeerConnection closed');
    }

    // Stop all local tracks
    if (localStream) {
      localStream.getTracks().forEach((track, idx) => {
        track.enabled = false;
        track.stop();
      });
      setLocalStream(null);
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      try {
        localVideoRef.current.pause();
      } catch (e) {
        console.warn('Error pausing local video:', e);
      }
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      try {
        remoteVideoRef.current.pause();
      } catch (e) {
        console.warn('Error pausing remote video:', e);
      }
    }
    
    setRemoteStream(null);
    setConnectionState('closed');
  } catch (err) {
    console.error('Error closing peer connection:', err);
    try {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        localVideoRef.current.pause();
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        remoteVideoRef.current.pause();
      }
      setRemoteStream(null);
      setConnectionState('closed');
    } catch (e) {
      console.error('Error in fallback cleanup:', e);
    }
  }
}, [localStream, localVideoRef, remoteVideoRef]);

  const resetWebRTC = useCallback(() => {


    // Close peer connection
    closePeerConnection();

    // Stop local stream
    stopLocalStream();

    // Clear refs and state
    peerConnectionRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('new');


  }, [closePeerConnection, stopLocalStream, connectionState, localStream, remoteStream]);

  // Listen for a global callEnded event to ensure all hook instances
  // perform cleanup (useful when multiple hooks/components may hold streams)
  useEffect(() => {
    const handler = () => {
      try {
        if (typeof closePeerConnection === 'function') closePeerConnection();
        if (typeof stopLocalStream === 'function') stopLocalStream();
        try { killAllMedia(); } catch { /* ignore */ }
      } catch (err) {
        console.warn('Error during global callEnded handler:', err);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('callEnded', handler);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('callEnded', handler);
      }
    };
  }, [closePeerConnection, stopLocalStream]);

  return {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    connectionState,
    initializePeerConnection,
    getLocalStream,
    addLocalStreamToPeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    stopLocalStream,
    closePeerConnection,
    resetWebRTC,
    peerConnection: peerConnectionRef.current
  };
};

export default useWebRTC;
