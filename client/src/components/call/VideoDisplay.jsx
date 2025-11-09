import React, { useRef, useEffect } from "react";

/**
 * VideoDisplay Component
 * Handles rendering of remote/local video or avatar based on call state
 * 
 * Props:
 * - callType: 'audio' | 'video'
 * - remoteStream: MediaStream | null
 * - localStream: MediaStream | null
 * - cameraEnabled: boolean
 * - user: { name, avatarUrl }
 * - remoteVideoRef: React.Ref
 * - localVideoRef: React.Ref
 */
export default function VideoDisplay({
  callType,
  remoteStream,
  localStream,
  cameraEnabled,
  user,
  remoteVideoRef,
  localVideoRef,
}) {
  const remoteAudioRef = useRef(null);

  // Attach remote audio stream to hidden audio element
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Determine what to display
  const renderContent = () => {
    // Video call with remote stream available
    if (callType === "video" && remoteStream) {
      return (
        <>
          {/* Remote Video - Full Screen */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Hidden audio element for remote audio */}
          <audio ref={remoteAudioRef} autoPlay playsInline />

          {/* Local Video - Picture in Picture */}
          {localStream && (
            <div className="absolute bottom-24 right-6 w-32 h-40 rounded-lg overflow-hidden shadow-2xl border-2 border-white bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </>
      );
    }

    // Video call but camera off - show remote video or local if available
    if (callType === "video") {
      if (remoteStream) {
        return (
          <>
            {/* Remote Video - Full Screen */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <audio ref={remoteAudioRef} autoPlay playsInline />
          </>
        );
      }

      if (cameraEnabled && localStream) {
        // Show local video if camera enabled but no remote stream yet
        return (
          <>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <audio ref={remoteAudioRef} autoPlay playsInline />
          </>
        );
      }

      // Camera disabled - show user avatar
      return (
        <>
          <UserAvatar user={user} type="video" />
          <audio ref={remoteAudioRef} autoPlay playsInline />
        </>
      );
    }

    // Audio call - show avatar
    if (callType === "audio") {
      return (
        <>
          <UserAvatar user={user} type="audio" />
          <audio ref={remoteAudioRef} autoPlay playsInline />
        </>
      );
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {renderContent()}
    </div>
  );
}

/**
 * User Avatar Component
 */
function UserAvatar({ user, type = "video" }) {
  const avatarUrl =
    user?.avatarUrl && user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : user?.avatarUrl
        ? `${import.meta.env.VITE_API_URL.replace("/api", "")}${user.avatarUrl}`
        : null;

  if (type === "audio") {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center border-4 border-green-400 animate-pulse">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-5xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          )}
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            {user?.name || "User"}
          </h2>
          <p className="text-sm text-gray-400 mt-2">🎤 Audio Call</p>
        </div>
      </div>
    );
  }

  // Video type
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-4 border-blue-400">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-4xl font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </span>
        )}
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{user?.name || "User"}</h2>
        <p className="text-sm text-gray-400 mt-1">Camera is off</p>
      </div>
    </div>
  );
}
