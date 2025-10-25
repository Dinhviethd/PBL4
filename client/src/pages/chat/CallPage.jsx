import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, PhoneOff } from "lucide-react";
import { useAuthInit } from "@/hooks/useAuthInit";

export default function CallPage() {
  const { user } = useAuthInit();
  
  // Initialize from call settings
  const initialSettings = sessionStorage.getItem("callSettings");
  const settings = initialSettings ? JSON.parse(initialSettings) : { cameraEnabled: true, micEnabled: true };
  
  const [cameraEnabled, setCameraEnabled] = useState(settings.cameraEnabled);
  const [micEnabled, setMicEnabled] = useState(settings.micEnabled);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);

  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioSourceRef = useRef(null);

  // Start camera and microphone
  useEffect(() => {
    const startMedia = async () => {
      try {
        const constraints = {
          video: cameraEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          audio: micEnabled ? { echoCancellation: true, noiseSuppression: true } : false,
        };

        if (!cameraEnabled && !micEnabled) {
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
          }
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        // Display video
        if (cameraEnabled && videoRef.current) {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            videoRef.current.srcObject = stream;
          }
        }

        // Setup audio for speaker playback simulation
        if (speakerEnabled && stream.getAudioTracks().length > 0) {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          const audioContext = audioContextRef.current;

          if (!audioSourceRef.current) {
            audioSourceRef.current = audioContext.createMediaStreamAudioSource(stream);
            const analyser = audioContext.createAnalyser();
            analyserRef.current = analyser;
            audioSourceRef.current.connect(analyser);
            analyser.connect(audioContext.destination);
          }
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    startMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [cameraEnabled, micEnabled, speakerEnabled]);

  // Handle camera toggle
  const handleToggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setCameraEnabled(!cameraEnabled);
  };

  // Handle mic toggle
  const handleToggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setMicEnabled(!micEnabled);
  };

  // Handle speaker toggle
  const handleToggleSpeaker = () => {
    if (audioContextRef.current && audioSourceRef.current) {
      const destination = speakerEnabled
        ? audioContextRef.current.createMediaStreamDestination()
        : audioContextRef.current.destination;

      audioSourceRef.current.disconnect();
      audioSourceRef.current.connect(destination);
    }
    setSpeakerEnabled(!speakerEnabled);
  };

  // Handle end call
  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    // Navigate to chat page or previous page
    window.history.back();
  };

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center relative">
      {/* Video Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {cameraEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Avatar Circle */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-4 border-blue-400">
              {user?.avatarUrl ? (
                <img
                  src={
                    user.avatarUrl.startsWith("http")
                      ? user.avatarUrl
                      : `${import.meta.env.VITE_API_URL.replace("/api", "")}${user.avatarUrl}`
                  }
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{user?.name || "User"}</h2>
              <p className="text-sm text-gray-400 mt-1">Camera is off</p>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons - Bottom Center */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
        {/* Mute Mic Button */}
        <button
          onClick={handleToggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 ${
            micEnabled
              ? "bg-gray-600 text-white hover:bg-gray-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
          title={micEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        {/* Toggle Camera Button */}
        <button
          onClick={handleToggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 ${
            cameraEnabled
              ? "bg-gray-600 text-white hover:bg-gray-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
          title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {cameraEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        {/* Speaker Button */}
        <button
          onClick={handleToggleSpeaker}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 ${
            speakerEnabled
              ? "bg-gray-600 text-white hover:bg-gray-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
          title={speakerEnabled ? "Mute speaker" : "Unmute speaker"}
        >
          {speakerEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg hover:scale-110"
          title="End call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
