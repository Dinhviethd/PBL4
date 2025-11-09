import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, PhoneOff, AlertCircle } from "lucide-react";
import { useAuthInit } from "@/hooks/useAuthInit";
import useChatStore from "@/zustand/chatStore";
import useWebRTC from "@/hooks/useWebRTC";
import useCallSignaling from "@/hooks/useCallSignaling";
import VideoDisplay from "@/components/call/VideoDisplay";
import { useNotification } from "@/hooks/useNotification";

export default function CallPage() {
  const navigate = useNavigate();
  const { user } = useAuthInit();
  const { activeCall, clearActiveCall } = useChatStore();
  const { showNotification } = useNotification();
  
  // Get call type from activeCall state
  const callType = activeCall?.callType || 'audio';
  
  // Track video refs for VideoDisplay component
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Initialize WebRTC hook with custom refs
  const webRTC = useWebRTC(callType, videoRef, remoteVideoRef);
  
  // Initialize signaling hook to get callInfo state and endCall function
  const { signalingState, callInfo, endCall } = useCallSignaling(webRTC);
  
  // Initialize from call settings
  const initialSettings = sessionStorage.getItem("callSettings");
  const settings = initialSettings ? JSON.parse(initialSettings) : { cameraEnabled: true, micEnabled: true };
  
  const [cameraEnabled, setCameraEnabled] = useState(settings.cameraEnabled);
  const [micEnabled, setMicEnabled] = useState(settings.micEnabled);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [mediaError, setMediaError] = useState(null);
  
  // Track cached streams to sync refs with hook state
  const localStreamCacheRef = useRef(null);
  const remoteStreamCacheRef = useRef(null);

  /**
   * Sync localStreamRef with webRTC.localStream
   * Ensures refs stay in sync
   */
  useEffect(() => {
    if (webRTC?.localStream) {
      localStreamCacheRef.current = webRTC.localStream;
      console.log('✅ ✅ ✅ ✅✅ Local stream cached in ref', webRTC.localStream);
    }
  }, [webRTC?.localStream]);

  /**
   * Sync remoteStreamRef with webRTC.remoteStream
   */
  useEffect(() => {
    if (webRTC?.remoteStream) {
      remoteStreamCacheRef.current = webRTC.remoteStream;
      console.log('✅ ✅ ✅ ✅✅ ✅ ✅ ✅ ✅✅ Remote stream cached in ref', webRTC.remoteStream);
    }
  }, [webRTC?.remoteStream]);

  /**
   * Initialize WebRTC peer connection when conditions are met
   * Guard checks:
   * 1. signalingState === 'connected' (caller has peer response)
   * 2. activeCall.status === 'accepted' (callee explicitly accepted)
   * 3. Don't reinit if already have localStream
   */
  useEffect(() => {
    const initializeCall = async () => {
      try {
        console.log('📱 Initializing WebRTC peer connection...');
        console.log('   Caller initiating: signalingState =', signalingState);
        console.log('   Callee accepting: activeCall.status =', activeCall?.status);
        
        // Get local stream and add to peer connection
        const stream = await webRTC.addLocalStreamToPeerConnection();
        
        // Sync refs
        localStreamCacheRef.current = stream;
        if (videoRef.current && callType === 'video') {
          videoRef.current.srcObject = stream;
        }

        console.log('✅ WebRTC peer connection initialized with', {
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length
        });
      } catch (error) {
        console.error('❌ Error initializing WebRTC:', error);
        setMediaError(error.message || 'Failed to initialize media');
        showNotification('Could not access camera/microphone', 'error');
      }
    };

    // Guard: Check preconditions
    console.log('🔍 Checking WebRTC init conditions:', {
      hasWebRTC: !!webRTC,
      hasLocalStream: !!webRTC?.localStream,
      signalingState,
      activeCallStatus: activeCall?.status,
      callInfo: !!callInfo
    });

    if (!webRTC || webRTC.localStream) {
      console.log('⚠️  Skipping init: webRTC not ready or localStream already exists');
      return;  // Not ready or already initialized
    }
    
    // Condition 1: Caller - signalingState must be 'connected' (peer responded)
    const isCallerReady = signalingState === 'connected';
    
    // Condition 2: Callee - activeCall.status must be 'accepted' (explicitly accepted)
    // activeCall has all needed data, don't wait for callInfo (it might be null after navigation)
    const isCalleeReady = activeCall?.status === 'accepted' && activeCall?.idCall;
    
    console.log('🔍 Init readiness:', { isCallerReady, isCalleeReady });
    
    if (isCallerReady || isCalleeReady) {
      console.log('✅ All conditions met - initializing WebRTC immediately!');
      initializeCall();
    } else {
      console.log('⏳ Waiting for conditions: caller needs "connected" state, callee needs "accepted" status + idCall');
    }

  }, [webRTC, activeCall?.status, activeCall?.idCall, signalingState, callType, callInfo, showNotification]);

  // Handle camera toggle
  const handleToggleCamera = useCallback(() => {
    const stream = localStreamCacheRef.current || webRTC?.localStream;
    if (!stream) {
      console.warn('⚠️  No local stream available to toggle camera');
      showNotification('Camera not available', 'warning');
      return;
    }

    try {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        console.warn('⚠️  No video tracks found');
        return;
      }

      const newState = !cameraEnabled;
      videoTracks.forEach((track) => {
        track.enabled = newState;
      });

      setCameraEnabled(newState);
      console.log(`📹 Camera ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling camera:', error);
      showNotification('Could not toggle camera', 'error');
    }
  }, [webRTC?.localStream, cameraEnabled, showNotification]);

  // Handle mic toggle
  const handleToggleMic = useCallback(() => {
    const stream = localStreamCacheRef.current || webRTC?.localStream;
    if (!stream) {
      console.warn('⚠️  No local stream available to toggle mic');
      showNotification('Microphone not available', 'warning');
      return;
    }

    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn('⚠️  No audio tracks found');
        return;
      }

      const newState = !micEnabled;
      audioTracks.forEach((track) => {
        track.enabled = newState;
      });

      setMicEnabled(newState);
      console.log(`🎤 Microphone ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling mic:', error);
      showNotification('Could not toggle microphone', 'error');
    }
  }, [webRTC?.localStream, micEnabled, showNotification]);

  // Handle speaker toggle - actually mute/unmute audio output
  const handleToggleSpeaker = useCallback(() => {
    try {
      // Get all audio elements on page (remote video audio element)
      const audioElements = document.querySelectorAll('audio');
      
      if (audioElements.length === 0) {
        console.warn('⚠️  No audio elements found');
        setSpeakerEnabled(!speakerEnabled);
        return;
      }

      const newState = !speakerEnabled;
      audioElements.forEach((audio) => {
        // Set volume to 0 (mute) or 1 (unmute)
        audio.volume = newState ? 1 : 0;
      });

      setSpeakerEnabled(newState);
      console.log(`🔊 Speaker ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling speaker:', error);
      showNotification('Could not toggle speaker', 'error');
    }
  }, [speakerEnabled, showNotification]);

  // Auto end call when peer declines or ends
  // Only close if EXPLICITLY in 'idle' state (not just transient state changes)
  // Don't close during 'initiating', 'ringing', or 'connected' states
  useEffect(() => {
    // Only close if:
    // 1. signalingState is EXPLICITLY 'idle' (peer declined/ended)
    // 2. We were previously NOT in idle (means it just changed)
    // 3. We have call info (was in a call)
    // 4. debounce to confirm the state change isn't transient
    
    if (signalingState !== 'idle' || !callInfo) {
      return;  // Don't close - still in call or already closed
    }

    console.log('📞 Signaling state became idle, checking if peer ended call...');

    // Debounce: wait 500ms to confirm state change before closing
    // (prevents false triggers from transient state changes)
    const debounceTimer = setTimeout(() => {
      console.log('📞 Confirmed: Call ended by peer (decline/end), closing connection...');
      webRTC?.closePeerConnection();
      clearActiveCall();
      navigate('/', { replace: true });
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [signalingState, callInfo, webRTC, clearActiveCall, navigate]);

  // Handle end call
  const handleEndCall = useCallback(() => {
    console.log('📞 Ending call...');
    
    // ✅ Send CALL_END signal to peer before closing connection
    // Get callId and toUserId from activeCall or callInfo
    const callId = activeCall?.idCall || callInfo?.callId;
    const toUserId = activeCall?.toUserId || callInfo?.toUserId || activeCall?.fromUserId || callInfo?.fromUserId;
    
    if (callId && toUserId) {
      console.log(`📤 Sending CALL_END to peer (callId: ${callId}, toUserId: ${toUserId})`);
      endCall(callId, toUserId);
    } else {
      console.warn('⚠️  Cannot send CALL_END: missing callId or toUserId');
    }
    
    // Close WebRTC connection
    webRTC?.closePeerConnection();
    
    // Clear call state
    clearActiveCall();
    
    // Navigate back to home
    navigate('/', { replace: true });
  }, [webRTC, clearActiveCall, navigate, endCall, activeCall, callInfo]);

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Error Alert */}
      {mediaError && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-600/90 backdrop-blur-sm px-6 py-3 rounded-lg text-white flex items-center gap-3 z-20 max-w-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-sm">Media Error</p>
            <p className="text-xs opacity-90">{mediaError}</p>
          </div>
        </div>
      )}

      {/* Main Video Container */}
      <VideoDisplay
        callType={callType}
        remoteStream={webRTC?.remoteStream || null}
        localStream={webRTC?.localStream || null}
        cameraEnabled={cameraEnabled}
        user={user}
        remoteVideoRef={remoteVideoRef}
        localVideoRef={videoRef}
      />

      {/* Control Buttons - Bottom Center */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-10">
        {/* Mute Mic Button */}
        <button
          onClick={handleToggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl hover:scale-110 backdrop-blur-sm ${
            micEnabled
              ? "bg-gray-600/80 text-white hover:bg-gray-700/80"
              : "bg-red-600/80 text-white hover:bg-red-700/80"
          }`}
          title={micEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        {/* Toggle Camera Button */}
        <button
          onClick={handleToggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl hover:scale-110 backdrop-blur-sm ${
            cameraEnabled
              ? "bg-gray-600/80 text-white hover:bg-gray-700/80"
              : "bg-red-600/80 text-white hover:bg-red-700/80"
          }`}
          title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {cameraEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        {/* Speaker Button */}
        <button
          onClick={handleToggleSpeaker}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl hover:scale-110 backdrop-blur-sm ${
            speakerEnabled
              ? "bg-gray-600/80 text-white hover:bg-gray-700/80"
              : "bg-red-600/80 text-white hover:bg-red-700/80"
          }`}
          title={speakerEnabled ? "Mute speaker" : "Unmute speaker"}
        >
          {speakerEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-all shadow-2xl hover:scale-110 backdrop-blur-sm"
          title="End call"
        >
          <PhoneOff size={24} />
        </button>
      </div>

      {/* Call Info - Top Center */}
      {activeCall && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full text-white z-10">
          <p className="text-sm font-medium">
            {callType === 'video' ? '📹 Video Call' : '☎️ Audio Call'} 
            {webRTC?.connectionState === 'connected' ? ' • Connected ✅' : ' • Connecting...'}
          </p>
        </div>
      )}
    </div>
  );
}  