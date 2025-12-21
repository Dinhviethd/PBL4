import React from 'react';
import { Phone, Video } from 'lucide-react';

export const CallButtons = ({ 
  onAudioCallClick,
  onVideoCallClick,
  isDisabled = false 
}) => {
  return (
    <div className="flex gap-2">
      {/* Audio Call Button */}
      <button
        onClick={onAudioCallClick}
        disabled={isDisabled}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Audio Call"
      >
        <Phone className="w-5 h-5 text-green-600" />
      </button>

      {/* Video Call Button */}
      <button
        onClick={onVideoCallClick}
        disabled={isDisabled}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Video Call"
      >
        <Video className="w-5 h-5 text-blue-600" />
      </button>
    </div>
  );
};

export default CallButtons;
