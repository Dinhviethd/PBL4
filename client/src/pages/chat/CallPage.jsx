import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, PhoneOff, AlertCircle } from "lucide-react";
import { useAuthInit } from "@/hooks/useAuthInit";
import useChatStore from "@/zustand/chatStore";
import useWebRTC from "@/hooks/useWebRTC";
import useCallSignaling from "@/hooks/useCallSignaling";
import VideoDisplay from "@/components/call/VideoDisplay";
import { useNotification } from "@/hooks/useNotification";
import { killAllMedia } from "@/lib/mediaCleanup";

export default function CallPage() {
  const navigate = useNavigate();
  const { user } = useAuthInit();
  const { activeCall, clearActiveCall } = useChatStore();
  const { showNotification } = useNotification();
  

  
  // Flag to prevent rendering after call ends
  const isCallEndingRef = useRef(false);
  
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

  // Determine remote user info based on call direction
  const isCaller = activeCall?.fromUserId === user?.idUser; // If I initiated the call
  const remoteUserInfo = isCaller 
    ? activeCall?.remoteUserInfo || callInfo?.remoteUserInfo // For outgoing calls, use remoteUserInfo
    : activeCall?.caller || callInfo?.caller; // For incoming calls, use caller info


  useEffect(() => {
    // Capture refs in the effect scope
    const localRef = videoRef.current;
    const remoteRef = remoteVideoRef.current;
    const localStream = localStreamCacheRef.current;
    const remoteStream = remoteStreamCacheRef.current;
    const pc = webRTC?.peerConnection;

    return () => {
      try {
        
        // Close peer connection first
        if (pc && pc.connectionState !== 'closed') {
          try {
            pc.close();
          } catch (err) {
            console.error('Error closing PC:', err);
          }
        }

        // Stop all local tracks
        if (localStream) {
          try {
            localStream.getTracks().forEach(track => {
              track.stop();
            });
          } catch (err) {
            console.error('Error stopping local tracks:', err);
          }
        }
        
        // Stop all remote tracks
        if (remoteStream) {
          try {
            remoteStream.getTracks().forEach(track => {
              track.stop();
            });
          } catch (err) {
            console.error('Error stopping remote tracks:', err);
          }
        }
        
        // Clear video element references
        try {
          if (localRef) localRef.srcObject = null;
          if (remoteRef) remoteRef.srcObject = null;
        } catch (err) {
          console.error('Error clearing video elements:', err);
        }
        
      } catch (err) {
        console.error('Error during CallPage unmount cleanup:', err);
      }
    };
  }, [webRTC?.peerConnection]);

  useEffect(() => {
    if (webRTC?.localStream) {
      localStreamCacheRef.current = webRTC.localStream;
    }
  }, [webRTC?.localStream]);

  // Ensure we show a local preview immediately for video calls
  // (so PiP/local video appears even before signaling/connect completes)
  useEffect(() => {
    let mounted = true;
    const ensureLocalPreview = async () => {
      try {
        if (callType !== 'video') return;
        // If there's already a stream, nothing to do
        if (webRTC?.localStream) {
          if (videoRef.current && webRTC.localStream) {
            videoRef.current.srcObject = webRTC.localStream;
            localStreamCacheRef.current = webRTC.localStream;
          }
          return;
        }

        // Try to get local stream for preview only (does not add tracks to peerConnection here)
        if (webRTC && typeof webRTC.getLocalStream === 'function') {
          const stream = await webRTC.getLocalStream();
          if (!mounted) return;
          localStreamCacheRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Could not get local preview stream:', err);
      }
    };

    ensureLocalPreview();

    return () => {
      mounted = false;
    };
  }, [webRTC, callType]);

  // Listen for global 'callEnded' event to reset CallPage state immediately
  useEffect(() => {
    const handler = () => {
    
      // Set flag to prevent re-renders
      isCallEndingRef.current = true;
      
      setCameraEnabled(false);
      setMicEnabled(false);
      setSpeakerEnabled(false);
      setMediaError(null);
      clearActiveCall();
      
      // Hard kill any leftover tracks as a final safety
      try { killAllMedia(); } catch { /* ignore */ }

      // Navigate away IMMEDIATELY to unmount CallPage and stop rendering video
      navigate('/', { replace: true });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('callEnded', handler);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('callEnded', handler);
      }
    };
  }, [navigate, clearActiveCall]);

  useEffect(() => {
    if (webRTC?.remoteStream) {
      remoteStreamCacheRef.current = webRTC.remoteStream;
    }
  }, [webRTC?.remoteStream]);


  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Get local stream and add to peer connection
        const stream = await webRTC.addLocalStreamToPeerConnection();
        // Sync refs
        localStreamCacheRef.current = stream;
        if (videoRef.current && callType === 'video') {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        setMediaError(error.message || 'Failed to initialize media');
        showNotification('Could not access camera/microphone', 'error');
      }
    };

    if (!webRTC || webRTC.localStream) {
      return;  // Not ready or already initialized
    }
    
    const isCallerReady = signalingState === 'connected';
    const isCalleeReady = activeCall?.status === 'accepted' && activeCall?.idCall;
    
    if (isCallerReady || isCalleeReady) {
      initializeCall();
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
    } catch (error) {
      console.error(' Error toggling camera:', error);
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
        console.warn('No audio tracks found');
        return;
      }

      const newState = !micEnabled;
      audioTracks.forEach((track) => {
        track.enabled = newState;
      });

      setMicEnabled(newState);


    } catch (error) {
      console.error(' Error toggling mic:', error);
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
    } catch (error) {
      console.error('Error toggling speaker:', error);
      showNotification('Could not toggle speaker', 'error');
    }
  }, [speakerEnabled, showNotification]);

  useEffect(() => {
    if (signalingState !== 'idle' || !callInfo) {
      return;
    }


    // Debounce: wait 300ms to confirm state change before closing
    const debounceTimer = setTimeout(() => {
      
      try {
        // Force cleanup all streams
        if (localStreamCacheRef.current) {
          localStreamCacheRef.current.getTracks().forEach(track => {
            track.stop();
          });
        }
        
        if (remoteStreamCacheRef.current) {
          remoteStreamCacheRef.current.getTracks().forEach(track => {
            track.stop();
          });
        }
        
        // Clear video elements
        if (videoRef.current) videoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        
        // Close peer connection
        webRTC?.closePeerConnection();
        clearActiveCall();
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Error during peer end cleanup:', err);
        navigate('/', { replace: true });
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [signalingState, callInfo, webRTC, clearActiveCall, navigate]);

  // Handle end call
  const handleEndCall = useCallback(() => {
    try {
      console.log("audioooooooooooooo, callinfor", callInfo)
      console.log("audioooooooooooooo, activecall", activeCall)
      
      const callId = activeCall?.idCall || callInfo?.callId;
      const toUserId = activeCall?.toUserId || callInfo?.toUserId || activeCall?.fromUserId || callInfo?.fromUserId;
      
      if (callId && toUserId) {
        endCall(callId, toUserId);
      } else {
        console.warn('   ⚠️ Missing callId or toUserId for endCall');
      }
      
      // Close WebRTC connection
      console.log(' Closing WebRTC connection...');
      webRTC?.closePeerConnection();
      
      // Force cleanup all streams immediately
      if (localStreamCacheRef.current) {
        localStreamCacheRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      if (remoteStreamCacheRef.current) {
        remoteStreamCacheRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // Clear video elements
      if (videoRef.current) videoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      
      // Clear call state
      clearActiveCall();
      
      // Navigate back to home
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error ending call:', err);
      navigate('/', { replace: true });
    }
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
      {(() => {
        // Early return if call is ending to prevent unnecessary renders
        if (isCallEndingRef.current) {
          return null;
        }
        return null;
      })()}
      {!isCallEndingRef.current && (
        <VideoDisplay
          callType={callType}
          remoteStream={webRTC?.remoteStream || null}
          localStream={webRTC?.localStream || null}
          cameraEnabled={cameraEnabled}
          user={user}
          remoteVideoRef={remoteVideoRef}
          localVideoRef={videoRef}
          remoteUserInfo={remoteUserInfo}
        />
      )}

      {/* Control Buttons - Bottom Center */}
      {!isCallEndingRef.current && (
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

        {/* Toggle Camera Button - Only show for video calls */}
        {callType === 'video' && (
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
        )}

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
      )}

      {/* Call Info - Top Center */}
      {!isCallEndingRef.current && activeCall && (
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