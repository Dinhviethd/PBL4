import { useEffect, useState, useCallback } from 'react';
import { callService } from '@/services/call.service';

/**
 * useCallHistory Hook
 * Lấy lịch sử cuộc gọi giữa hai user với pagination
 */
export const useCallHistory = (conversationId, currentUserId, otherUserId, enabled = true) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  const fetchCallHistory = useCallback(async (pageNum = 1) => {
    // Validate parameters
    if (!enabled) {
      return;
    }

    if (!otherUserId || isNaN(otherUserId)) {
      return;
    }

    if (!currentUserId || isNaN(currentUserId)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await callService.getCallHistory(otherUserId, pageNum, LIMIT);
      
      
      if (response?.data) {
        const callsData = response.data.data || response.data;
        
        if (!Array.isArray(callsData)) {
          return;
        }        
        const filteredCalls = callsData.filter(call => 
          (call.caller_id === currentUserId && call.receiver_id === otherUserId) ||
          (call.caller_id === otherUserId && call.receiver_id === currentUserId)
        );
    
        filteredCalls.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
        
        if (pageNum === 1) {
          setCalls(filteredCalls);
        } else {
          setCalls(prev => [...prev, ...filteredCalls]);
        }
        
        setHasMore(filteredCalls.length === LIMIT);
        setPage(pageNum);
        
      }
    } catch (err) {
      console.error('Error fetching call history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, otherUserId, enabled]);

  useEffect(() => {
    fetchCallHistory(1);
  }, [fetchCallHistory]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchCallHistory(page + 1);
    }
  }, [page, hasMore, loading, fetchCallHistory]);

  const addCall = useCallback((newCall) => {
    setCalls(prev => [newCall, ...prev]);
  }, []);

  return {
    calls,
    loading,
    error,
    hasMore,
    page,
    loadMore,
    fetchCallHistory,
    addCall,
  };
};

export default useCallHistory;
