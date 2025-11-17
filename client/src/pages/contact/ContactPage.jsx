import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import FriendsList from './FriendsList';
import GroupsList from './GroupsList';
import FriendInvites from './FriendInvites';
import GroupInvites from './GroupInvites';
import { getReceivedRequests } from '@/services/friendShip.service';

const ContactPage = () => {
  const [activeSection, setActiveSection] = useState('friends');
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  // Fetch số lời mời kết bạn chưa xử lý
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await getReceivedRequests(1, 100); // Fetch tất cả để đếm
      setPendingInviteCount(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch pending invites count:', err);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  const renderContent = () => {
    switch (activeSection) {
      case 'friends': return <FriendsList />;
      case 'groups': return <GroupsList />;
      case 'invites': return <FriendInvites onInviteCountChange={fetchPendingCount} />;
      case 'pending': return <GroupInvites />;
      default: return <FriendsList />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} pendingInviteCount={pendingInviteCount} />
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
};

export default ContactPage;
