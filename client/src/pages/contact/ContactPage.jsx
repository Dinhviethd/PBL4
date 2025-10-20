import React, { useState } from 'react';
import Sidebar from './Sidebar';
import FriendsList from './FriendsList';
import GroupsList from './GroupsList';
import FriendInvites from './FriendInvites';
import GroupInvites from './GroupInvites';

const ContactPage = () => {
  const [activeSection, setActiveSection] = useState('friends');

  const renderContent = () => {
    switch (activeSection) {
      case 'friends': return <FriendsList />;
      case 'groups': return <GroupsList />;
      case 'invites': return <FriendInvites />;
      case 'pending': return <GroupInvites />;
      default: return <FriendsList />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
};

export default ContactPage;
