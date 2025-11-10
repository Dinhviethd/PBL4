import React from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const CallHistoryItem = ({ call, currentUserId, otherUser }) => {
  
  // Xác định nếu user hiện tại là người gọi hay người nhận
  const callerId = Number(call.caller_id);
  const userId = Number(currentUserId);
  const isCaller = callerId === userId;
  const isAnswered = call.answeredAt !== null; // Check if call was answered
  
  // Format thời gian gọi
  const formatDuration = (seconds) => {
    if (!seconds) return '0 giây';
    if (seconds < 60) return `${seconds} giây`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format thời gian
  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now - d) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    
    return d.toLocaleDateString('vi-VN');
  };

  return (
    <div className="flex items-start gap-2">
      {/* Avatar - Outside Border */}
      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
        <AvatarImage src={otherUser?.avatarUrl} alt={otherUser?.name} />
        <AvatarFallback>{otherUser?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
      </Avatar>

      {/* Call Info - Inside Border */}
      <div className="flex-1 min-w-0 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg">
        {/* Badge + Time */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
            {call.callType === 'video' ? 'Video' : 'Audio'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(call.startedAt)}
          </span>
        </div>

        {/* Call Status + Duration */}
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          {/* Call Direction Icon + Text */}
          {isCaller ? (
            <>
              <PhoneOutgoing size={13} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="flex-1">
                Cuộc gọi đi
                {isAnswered && call.duration && (
                  <> · <span className="text-gray-900 dark:text-white">{formatDuration(call.duration)}</span></>
                )}
                {!isAnswered && (
                  <> · <span className="text-red-600 font-medium">Không trả lời</span></>
                )}
              </span>
            </>
          ) : (
            <>
              <PhoneIncoming size={13} className={isAnswered ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
              <span className="flex-1">
                Cuộc gọi đến
                {isAnswered && call.duration && (
                  <> · <span className="text-gray-900 dark:text-white">{formatDuration(call.duration)}</span></>
                )}
                {!isAnswered && (
                  <> · <span className="text-red-600 font-medium">Đã từ chối</span></>
                )}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallHistoryItem;
