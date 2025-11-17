// Global media tracker and hard kill switch for camera/mic
// Tracks all MediaStreams created via getUserMedia and provides killAllMedia()

let originalGetUserMedia = null;
const trackedStreams = new Set();

export function installMediaTracker() {
  try {
    if (typeof window === 'undefined') return;
    if (originalGetUserMedia) return; // already installed
    const mediaDevices = navigator?.mediaDevices;
    if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') return;

    originalGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
    mediaDevices.getUserMedia = async function patchedGetUserMedia(constraints) {
      const stream = await originalGetUserMedia(constraints);
      try {
        trackedStreams.add(stream);
        const onEndedCheck = () => {
          const anyActive = stream.getTracks().some(t => t && t.readyState !== 'ended');
          if (!anyActive) {
            trackedStreams.delete(stream);
          }
        };
        stream.getTracks().forEach(t => {
          try { t.addEventListener('ended', onEndedCheck); } catch {}
        });
      } catch {}
      return stream;
    };
    window.__mediaTrackerInstalled = true;
  } catch {}
}

export function killAllMedia() {
  try {
    if (typeof window === 'undefined') return;
    // Stop any tracked streams
    trackedStreams.forEach(stream => {
      try {
        stream.getTracks().forEach(t => { try { t.enabled = false; t.stop(); } catch {} });
      } catch {}
    });
    trackedStreams.clear();

    // Also stop anything attached to <video>/<audio> elements
    const elements = Array.from(document.querySelectorAll('video, audio'));
    elements.forEach(el => {
      try {
        const s = el.srcObject;
        if (s && typeof s.getTracks === 'function') {
          s.getTracks().forEach(t => { try { t.enabled = false; t.stop(); } catch {} });
        }
        el.srcObject = null;
        if (typeof el.pause === 'function') el.pause();
      } catch {}
    });
  } catch {}
}
