/**
 * Các utility functions cho Video Call
 */

/**
 * Format thời gian từ giây thành MM:SS
 */
export const formatCallDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Kiểm tra browser hỗ trợ WebRTC
 */
export const checkWebRTCSupport = () => {
  const hasGetUserMedia = !!(
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  );

  const hasPeerConnection = !!(
    window.RTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.mozRTCPeerConnection
  );

  return hasGetUserMedia && hasPeerConnection;
};

/**
 * Kiểm tra quyền truy cập camera/mic
 */
export const checkMediaPermissions = async (callType = 'audio') => {
  try {
    const constraints = {
      audio: true,
      video: callType === 'video'
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // Stop the stream immediately after checking
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Media permission check failed:', error);
    return false;
  }
};

/**
 * Lấy thông tin ICE servers
 */
export const getIceServers = () => {
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Optional: Add TURN servers if needed for NAT traversal
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password'
    // }
  ];
};

/**
 * Normalize stream constraints
 */
export const getNormalizedConstraints = (callType = 'audio') => {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: callType === 'video' ? {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    } : false
  };
};

/**
 * Validate call configuration
 */
export const validateCallConfig = (callType) => {
  if (!checkWebRTCSupport()) {
    throw new Error('Your browser does not support WebRTC');
  }

  const validTypes = ['audio', 'video'];
  if (!validTypes.includes(callType)) {
    throw new Error(`Invalid call type: ${callType}`);
  }

  return true;
};
