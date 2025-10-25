import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2, Video, MicOff, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CallPreparationPage() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState({
    camera: [],
    microphone: [],
    speaker: [],
  });

  const [selectedDevices, setSelectedDevices] = useState({
    camera: "",
    microphone: "",
    speaker: "",
  });

  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micTestCountdown, setMicTestCountdown] = useState(8);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [networkStats, setNetworkStats] = useState({
    latency: "- ms",
    bandwidth: "- Mbps",
    packetLoss: "- %",
    quality: "unknown", // unknown, good, fair, poor, bad
  });

  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const micTestTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const micStreamRef = useRef(null);

  // Lấy danh sách thiết bị
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request quyền trước để có thể lấy label
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
          stream.getTracks().forEach(track => track.stop());
        }).catch(() => {
          // Nếu không được cấp quyền, vẫn tiếp tục
        });

        const allDevices = await navigator.mediaDevices.enumerateDevices();

        const cameras = allDevices.filter((device) => device.kind === "videoinput");
        const microphones = allDevices.filter((device) => device.kind === "audioinput");
        const speakers = allDevices.filter((device) => device.kind === "audiooutput");

        setDevices({
          camera: cameras,
          microphone: microphones,
          speaker: speakers,
        });

        // Đặt thiết bị mặc định
        if (cameras.length > 0) setSelectedDevices((prev) => ({ ...prev, camera: cameras[0].deviceId }));
        if (microphones.length > 0) setSelectedDevices((prev) => ({ ...prev, microphone: microphones[0].deviceId }));
        if (speakers.length > 0) setSelectedDevices((prev) => ({ ...prev, speaker: speakers[0].deviceId }));
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    };

    getDevices();

    // Lắng nghe sự thay đổi thiết bị
    navigator.mediaDevices.addEventListener("devicechange", getDevices);
    return () => navigator.mediaDevices.removeEventListener("devicechange", getDevices);
  }, []);

  // Camera Preview
  useEffect(() => {
    if (!selectedDevices.camera || !cameraEnabled) {
      // Stop camera if disabled
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    let isComponentMounted = true;

    const startCamera = async () => {
      try {
        // Stop previous stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDevices.camera } },
        });

        if (isComponentMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    startCamera();

    return () => {
      isComponentMounted = false;
    };
  }, [selectedDevices.camera, cameraEnabled]);

  // Test Microphone - vô thời hạn
  const handleTestMic = async () => {
    // Nếu đang test, thoát test
    if (isMicTesting) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      setMicLevel(0);
      setIsMicTesting(false);
      setMicTestCountdown(8);
      return;
    }

    // Bắt đầu test
    setIsMicTesting(true);
    setMicTestCountdown(8);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedDevices.microphone } },
      });
      micStreamRef.current = stream;

      // Tạo AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Cập nhật mic level
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMicLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.min(100, (average / 255) * 100);
        setMicLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(updateMicLevel);
      };

      updateMicLevel();
    } catch (error) {
      console.error("Error testing microphone:", error);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      setMicLevel(0);
      setIsMicTesting(false);
      setMicTestCountdown(8);
    }
  };

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => {
      if (micTestTimeoutRef.current) clearTimeout(micTestTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Simulate network stats in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random network stats
      const latency = Math.floor(Math.random() * 100) + 5; // 5-105ms
      const bandwidth = Math.floor(Math.random() * 80) + 20; // 20-100 Mbps
      const packetLoss = Math.floor(Math.random() * 5); // 0-5%

      // Determine quality based on latency and packet loss
      let quality = "unknown";
      if (latency <= 30 && packetLoss <= 1) {
        quality = "good"; // Green
      } else if (latency <= 60 && packetLoss <= 2) {
        quality = "fair"; // Yellow
      } else if (latency <= 100 && packetLoss <= 3) {
        quality = "poor"; // Orange
      } else {
        quality = "bad"; // Red
      }

      setNetworkStats({
        latency: `${latency} ms`,
        bandwidth: `${bandwidth} Mbps`,
        packetLoss: `${packetLoss}%`,
        quality,
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const handleDeviceChange = (deviceType, deviceId) => {
    setSelectedDevices((prev) => ({ ...prev, [deviceType]: deviceId }));
  };

  // Get color based on network quality
  const getQualityColor = () => {
    switch (networkStats.quality) {
      case "good":
        return "text-green-600"; // Green
      case "fair":
        return "text-yellow-500"; // Yellow
      case "poor":
        return "text-orange-500"; // Orange
      case "bad":
        return "text-red-600"; // Red
      default:
        return "text-gray-400";
    }
  };

  const getQualityLabel = () => {
    switch (networkStats.quality) {
      case "good":
        return "Kết nối tốt";
      case "fair":
        return "Kết nối chấp nhận được";
      case "poor":
        return "Kết nối yếu";
      case "bad":
        return "Kết nối xấu";
      default:
        return "Đang kiểm tra...";
    }
  };

  // Handle start call
  const handleStartCall = () => {
    // Store settings in sessionStorage
    sessionStorage.setItem(
      "callSettings",
      JSON.stringify({
        cameraEnabled,
        micEnabled,
      })
    );
    navigate("/call");
  };

  return (
    <div className="w-full h-full bg-gray-50">
      {/* Main Content */}
      <div className="flex flex-col overflow-hidden w-full h-full">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Chuẩn bị vào cuộc gọi</h1>
            <p className="text-gray-600 mb-8">Kiểm tra các cài đặt thiết bị trước khi bắt đầu cuộc gọi</p>

            <div className="grid grid-cols-3 gap-8">
              {/* Left: Preview và Test */}
              <div className="col-span-1 space-y-6">
                {/* Camera Preview */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="h-64 bg-gray-900 relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      onError={(e) => console.error("Video error:", e)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
                      {!cameraEnabled && <span>Camera tắt</span>}
                      {cameraEnabled && !streamRef.current && <span>Camera xem trước</span>}
                    </div>

                    {/* Camera and Mic Toggle Buttons - Centered Bottom */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 pointer-events-auto">
                      {/* Camera Toggle */}
                      <button
                        onClick={() => setCameraEnabled(!cameraEnabled)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 ${
                          cameraEnabled
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                        title={cameraEnabled ? "Tắt camera" : "Bật camera"}
                      >
                        {cameraEnabled ? <Video size={20} /> : <Video size={20} className="opacity-50" />}
                      </button>

                      {/* Mic Toggle */}
                      <button
                        onClick={() => setMicEnabled(!micEnabled)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 ${
                          micEnabled
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                        title={micEnabled ? "Tắt mic" : "Bật mic"}
                      >
                        {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Camera Preview</h3>
                  </div>
                </div>

                {/* Audio Test */}
                <div className="space-y-3">
                  {/* Test Speaker */}
                  <button className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                    <Volume2 size={20} />
                    Test Speaker
                  </button>

                  {/* Test Mic */}
                  <button
                    onClick={handleTestMic}
                    disabled={!micEnabled}
                    className={`w-full font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      !micEnabled
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : isMicTesting
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    <Mic size={20} />
                    {isMicTesting ? "Stop Mic" : "Test Mic"}
                  </button>

                  {/* Mic Level Bar */}
                  {isMicTesting && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="mb-2 text-sm font-medium text-gray-700">Mic Level</div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-100"
                          style={{ width: `${micLevel}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500 text-right">{Math.round(micLevel)}%</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Settings */}
              <div className="col-span-2 space-y-6">
                {/* Device Settings */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt thiết bị</h2>

                  {/* Camera */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Video size={18} />
                      Camera
                    </label>
                    <select
                      value={selectedDevices.camera}
                      onChange={(e) => handleDeviceChange("camera", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {devices.camera.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || "Camera"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Microphone */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Mic size={18} />
                      Microphone
                    </label>
                    <select
                      value={selectedDevices.microphone}
                      onChange={(e) => handleDeviceChange("microphone", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {devices.microphone.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || "Microphone"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speaker */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Volume2 size={18} />
                      Speaker
                    </label>
                    <select
                      value={selectedDevices.speaker}
                      onChange={(e) => handleDeviceChange("speaker", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {devices.speaker.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || "Speaker"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Network Statistics */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    {/* Status Dot */}
                    <div className={`w-3 h-3 rounded-full ${getQualityColor()}`} />
                    
                    {/* Connection Status */}
                    <span className={`text-sm font-semibold ${getQualityColor()}`}>
                      {getQualityLabel()}
                    </span>
                    
                    <span className="text-gray-400">•</span>
                    
                    {/* Bandwidth with Wifi Icon */}
                    <div className="flex items-center gap-1">
                      <Wifi size={16} className={getQualityColor()} />
                      <span className="text-sm font-semibold text-gray-700">{networkStats.bandwidth}</span>
                    </div>
                    
                    <span className="text-gray-400">•</span>
                    
                    {/* Latency */}
                    <span className="text-sm text-gray-600">{networkStats.latency}</span>
                  </div>
                </div>

                {/* Join Call Button */}
                <button 
                  onClick={handleStartCall}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl hover:shadow-lg transition-shadow text-lg hover:from-blue-700 hover:to-blue-800"
                >
                  Bắt đầu cuộc gọi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
