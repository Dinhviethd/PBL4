import React, { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';

export const IncomingCallModal = ({ 
  callInfo, 
  onAccept, 
  onDecline,
  autoRejectTime = 45 // seconds
}) => {
  const audioRef = useRef(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(autoRejectTime);
  const [isDeclined, setIsDeclined] = useState(false);

  // Auto-reject countdown
  useEffect(() => {
    if (!callInfo || isDeclined) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsDeclined(true);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [callInfo, isDeclined, onDecline]);

  // Play ringtone when call modal is shown
  useEffect(() => {
    if (callInfo && !isDeclined && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        setAudioBlocked(true);
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Pause ringtone when modal is closed
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [callInfo, isDeclined]);

  // Handler for user-triggered play
  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setAudioBlocked(false);
      }).catch(() => {
        setAudioBlocked(true);
      });
    }
  };

  // Reset timeLeft khi callInfo change
  useEffect(() => {
    if (callInfo) {
      setTimeLeft(autoRejectTime);
      setIsDeclined(false);
    }
  }, [callInfo, autoRejectTime]);

  // Lắng nghe sự kiện CALL_DECLINE để tắt modal
  useEffect(() => {
    const handleCallDecline = (event) => {
      const data = event.detail;
      if (data.type === 'CALL_DECLINE') {
        setIsDeclined(true);
        // Dọn dẹp kết nối nếu cần
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        // Có thể cập nhật đoạn chat ở component cha qua callback hoặc context
        // Ví dụ: gọi hàm onCallDeclined?.(data) nếu được truyền vào
      }
    };
    window.addEventListener('callSignalingMessage', handleCallDecline);
    return () => {
      window.removeEventListener('callSignalingMessage', handleCallDecline);
    };
  }, []);

  useEffect(() => {
    console.log('[IncomingCallModal] mount, callInfo:', callInfo, 'isDeclined:', isDeclined);
    return () => {
      console.log('[IncomingCallModal] unmount, callInfo:', callInfo, 'isDeclined:', isDeclined);
    };
  }, []);

  useEffect(() => {
    console.log('[IncomingCallModal] callInfo changed:', callInfo, 'isDeclined:', isDeclined);
  }, [callInfo]);

  useEffect(() => {
    console.log('[IncomingCallModal] isDeclined changed:', isDeclined, 'callInfo:', callInfo);
  }, [isDeclined]);

  useEffect(() => {
    const handleCallDecline = (event) => {
      const data = event.detail;
      if (data.type === 'CALL_DECLINE') {
        console.log('[IncomingCallModal] CALL_DECLINE event received, set isDeclined true');
        setIsDeclined(true);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    };
    window.addEventListener('callSignalingMessage', handleCallDecline);
    return () => {
      window.removeEventListener('callSignalingMessage', handleCallDecline);
    };
  }, []);

  if (!callInfo || isDeclined) return null;

  const callerName = callInfo.caller?.name || 'Unknown';
  const callerAvatar = callInfo.caller?.avatarUrl;
  const callType = callInfo.callType || 'audio';

  const handleAccept = () => {
    setIsDeclined(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onAccept?.();
  };

  const handleDecline = () => {
    setIsDeclined(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onDecline?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      {/* Ringtone audio element */}
      <audio ref={audioRef} src="/sounds/ringtone.mp3" loop preload="auto" />
      {audioBlocked && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={handlePlayAudio}
            className="bg-yellow-400 text-white px-4 py-2 rounded shadow font-semibold animate-pulse"
          >
            Bấm để phát chuông
          </button>
        </div>
      )}
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-96 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {callType === 'video' ? '📹 Cuộc gọi video' : '☎️ Cuộc gọi'}
          </h2>
        </div>

        {/* Caller Info */}
        <div className="flex flex-col items-center mb-8">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 border-4 border-blue-400 shadow-lg">
            {callerAvatar ? (
              <img
                src={
                  callerAvatar.startsWith('http')
                    ? callerAvatar
                    : `${import.meta.env.VITE_API_URL.replace('/api', '')}${callerAvatar}`
                }
                alt={callerName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={48} className="text-white" />
            )}
          </div>

          {/* Name */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{callerName}</h3>

          {/* Call Type Badge */}
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
            {callType === 'video' ? 'Video Call' : 'Audio Call'}
          </span>

          {/* Timer */}
          <div className="text-center">
            <p className="text-sm text-gray-500">Cuộc gọi đến trong</p>
            <p className="text-2xl font-bold text-red-500">{timeLeft}s</p>
            {timeLeft <= 5 && (
              <p className="text-xs text-red-500 mt-1 animate-pulse">
                Sẽ từ chối tự động trong {timeLeft}s
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {/* Decline Button */}
          <button
            onClick={handleDecline}
            disabled={isDeclined}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-md"
            title="Từ chối cuộc gọi"
          >
            <PhoneOff size={20} />
            Từ chối
          </button>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            disabled={isDeclined}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-md"
            title="Chấp nhận cuộc gọi"
          >
            <Phone size={20} />
            Chấp nhận
          </button>
        </div>

        {/* Info Text */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Cuộc gọi sẽ bị từ chối nếu không trả lời trong {autoRejectTime} giây
        </p>
      </div>

      {/* Ringing animation - optional background element */}
      <style>{`
        @keyframes ring {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .animate-in {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default IncomingCallModal;
