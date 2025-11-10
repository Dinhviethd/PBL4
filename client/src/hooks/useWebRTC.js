import { useRef, useState, useCallback } from 'react';

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
      console.log(`ICE state: ${peerConnection.iceConnectionState}`);
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
      
      const pc = peerConnectionRef.current;

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
  }, [addLocalStreamToPeerConnection, callType]);

  const createAnswer = useCallback(async () => {
    try {
      await addLocalStreamToPeerConnection();
      
      const pc = peerConnectionRef.current;

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
  }, [addLocalStreamToPeerConnection, callType]);

  const setRemoteDescription = useCallback(async (description) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) throw new Error('Peer connection not initialized');
      await pc.setRemoteDescription(new RTCSessionDescription(description));
      
    } catch (error) {
      console.error(` Error setting remote description:`, error);
      throw error;
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) throw new Error('Peer connection not initialized');

      if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  const closePeerConnection = useCallback(() => {
  try {
    const pc = peerConnectionRef.current;

    if (pc && pc.connectionState !== 'closed') {
      pc.close();
      peerConnectionRef.current = null;
    }

    // Stop all local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setRemoteStream(null);
    setConnectionState('closed');
  } catch (err) {
    console.error('Error closing peer connection:', err);
    try {
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setRemoteStream(null);
      setConnectionState('closed');
    } catch (e) {
      console.error('Error in fallback cleanup:', e);
    }
  }
}, [localStream, localVideoRef, remoteVideoRef]);

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
    peerConnection: peerConnectionRef.current
  };
};

export default useWebRTC;
