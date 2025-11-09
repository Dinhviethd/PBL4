import { useRef, useState, useCallback } from 'react';

/**
 * Hook quản lý WebRTC connection
 * Hỗ trợ audio và video
 * Sử dụng STUN servers
 * 
 * @param {string} callType - 'audio' or 'video'
 * @param {React.Ref} customLocalVideoRef - Optional custom ref for local video
 * @param {React.Ref} customRemoteVideoRef - Optional custom ref for remote video
 */
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

    console.log('🔧 Creating RTCPeerConnection...');
    const peerConnection = new RTCPeerConnection({ iceServers: stunServersRef.current });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE candidate generated:', event.candidate.candidate?.substring(0, 50) + '...');
        window.dispatchEvent(new CustomEvent('iceCandidate', { detail: event.candidate }));
      } else {
        console.log('🧊 ICE candidate gathering completed');
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('📹 Remote track received:', event.track.kind, '| Streams:', event.streams.length);
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current && callType === 'video') {
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log('✅ Remote stream attached to video element');
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log(`🔌 Connection state: ${state}`);
      if (state === 'connected') {
        console.log('✅✅✅ PEER CONNECTION ESTABLISHED! ✅✅✅');
      } else if (state === 'failed') {
        console.log('❌ Connection failed');
      }
      setConnectionState(state);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE state: ${peerConnection.iceConnectionState}`);
    };

    peerConnectionRef.current = peerConnection;
    console.log('✅ RTCPeerConnection created');
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
        console.log('📡 Getting local media stream...');
        stream = await getLocalStream();
        console.log('✅ Local stream obtained:', {
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length
        });
      }

      const pc = initializePeerConnection();
      
      // ✅ CHECK IF TRACKS ALREADY ADDED
      const existingSenders = pc.getSenders();
      const existingTracks = existingSenders.map(sender => sender.track);
      
      console.log('📡 Checking for existing tracks in peer connection');
      console.log(`   Current senders: ${existingSenders.length}, tracks: ${existingTracks.length}`);
      
      stream.getTracks().forEach(track => {
        // Skip if this track already added
        if (existingTracks.some(t => t && t.id === track.id)) {
          console.log(`  ⏭️  Skipping ${track.kind} track (already added)`);
          return;
        }
        
        console.log(`  ➕ Adding ${track.kind} track (${track.enabled ? 'enabled' : 'disabled'})`);
        pc.addTrack(track, stream);
      });

      console.log('✅ Local stream processing complete');
      return stream;
    } catch (error) {
      console.error('❌ Error adding local stream:', error);
      throw error;
    }
  }, [localStream, getLocalStream, initializePeerConnection]);

  const createOffer = useCallback(async () => {
    try {
      console.log('\n📝 === CREATING SDP OFFER ===');
      console.log('📡 Adding local stream to peer connection...');
      await addLocalStreamToPeerConnection();
      
      const pc = peerConnectionRef.current;
      console.log('📝 Creating offer with constraints...');

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      });

      console.log('📝 Setting local description (offer)...');
      await pc.setLocalDescription(offer);
      
      console.log('✅ SDP Offer created successfully:', {
        type: offer.type,
        sdpLength: offer.sdp?.length,
        timestamp: new Date().toLocaleTimeString()
      });
      console.log('📤 Ready to send offer to peer');
      return offer;
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      throw error;
    }
  }, [addLocalStreamToPeerConnection, callType]);

  const createAnswer = useCallback(async () => {
    try {
      console.log('\n📝 === CREATING SDP ANSWER ===');
      console.log('📡 Adding local stream to peer connection...');
      await addLocalStreamToPeerConnection();
      
      const pc = peerConnectionRef.current;
      console.log('📝 Creating answer with constraints...');

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      });

      console.log('📝 Setting local description (answer)...');
      await pc.setLocalDescription(answer);
      
      console.log('✅ SDP Answer created successfully:', {
        type: answer.type,
        sdpLength: answer.sdp?.length,
        timestamp: new Date().toLocaleTimeString()
      });
      console.log('📤 Ready to send answer to peer');
      return answer;
    } catch (error) {
      console.error('❌ Error creating answer:', error);
      throw error;
    }
  }, [addLocalStreamToPeerConnection, callType]);

  const setRemoteDescription = useCallback(async (description) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) throw new Error('Peer connection not initialized');

      console.log('\n📡 === RECEIVING REMOTE DESCRIPTION ===');
      console.log(`📥 Receiving ${description.type?.toUpperCase()}:`, {
        type: description.type,
        sdpLength: description.sdp?.length,
        timestamp: new Date().toLocaleTimeString()
      });

      await pc.setRemoteDescription(new RTCSessionDescription(description));
      
      console.log(`✅ Remote description (${description.type}) set successfully`);
      console.log('📊 Connection state:', pc.connectionState);
      console.log('📊 ICE connection state:', pc.iceConnectionState);
    } catch (error) {
      console.error(`❌ Error setting remote description:`, error);
      throw error;
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) throw new Error('Peer connection not initialized');

      if (candidate) {
        console.log('🧊 Adding ICE candidate:', {
          sdpMLineIndex: candidate.sdpMLineIndex,
          candidateLength: candidate.candidate?.length,
          timestamp: new Date().toLocaleTimeString()
        });
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ ICE candidate added successfully');
      }
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  const closePeerConnection = useCallback(() => {
  console.log('\n🛑 === CLOSING PEER CONNECTION ===');

  const pc = peerConnectionRef.current;

  if (!pc) {
    console.log('⚠️ Peer connection is already closed or was never initialized');
  } else {
    console.log('🔌 Current state:', {
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      signalingState: pc.signalingState,
      senders: pc.getSenders().length,
      receivers: pc.getReceivers().length
    });

    if (pc.connectionState !== 'closed') {
      console.log('📤 Closing connection...');
      pc.close();
      console.log('✅ Peer connection closed successfully');
    } else {
      console.log('⚠️ Connection already closed, skipping close');
    }

    peerConnectionRef.current = null;
  }

  stopLocalStream();
  setRemoteStream(null);
  setConnectionState('closed');
  console.log('✅ Resources cleaned up');
}, [stopLocalStream]);

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
