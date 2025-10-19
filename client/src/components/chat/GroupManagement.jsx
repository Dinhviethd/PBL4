import React, { useState, useEffect } from 'react';
import { X, Plus, UserPlus, Check, AlertCircle, Crown, User, Clock, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import groupService from '@/services/group.service';
import userService from '@/services/user.service';
import { toast } from "sonner"

const GroupManagement = ({ group, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('USER');

  useEffect(() => {
    if (group) {
      setMembers(group.members || []);
      setUserRole(group.userRole || 'USER');
      loadPendingMembers();
    }
  }, [group]);

  useEffect(() => {
    if (searchTerm.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadPendingMembers = async () => {
    if (userRole !== 'ADMIN') return;
    
    try {
      const response = await groupService.getPendingMembers(group.idGroup);
      setPendingMembers(response.data || []);
    } catch (error) {
      if (error.response?.status !== 403) {
        console.error('Failed to load pending members:', error);
      }
    }
  };

  const searchUsers = async () => {
    try {
      const isEmail = searchTerm.includes('@');
      const lookupParams = isEmail 
        ? { email: searchTerm.trim() } 
        : { phone: searchTerm.trim() };
      
      const response = await userService.lookup(lookupParams);
      if (response) {
        // Check if user is already a member
        const isAlreadyMember = members.some(m => m.idUser === response.idUser);
        const isPending = pendingMembers.some(m => m.idUser.idUser === response.idUser);
        
        if (!isAlreadyMember && !isPending) {
          setSearchResults([{
            idUser: response.idUser,
            name: response.fullName || response.name || response.email,
            email: response.email,
            phone: response.phone,
            avatarUrl: response.avatarUrl || "/images/avatar-default-icon.png"
          }]);
        } else {
          setSearchResults([]);
          toast.error('User is already a member or pending approval');
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to search user:', error);
      setSearchResults([]);
    }
  };

  const addMember = async (user) => {
    setLoading(true);
    try {
      const response = await groupService.addMember(group.idGroup, { userId: user.idUser });
      
      if (response.data.status === 'pending_approval') {
        toast.success('User added to pending list. Admin approval required.');
        setPendingMembers(prev => [...prev, { 
          idUser: user,
          role: 'PENDING'
        }]);
      } else {
        toast.success('User added to group successfully!');
        setMembers(prev => [...prev, { 
          ...user,
          role: 'USER'
        }]);
      }
      
      setSearchTerm('');
      setSearchResults([]);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const approveMember = async (memberId) => {
    setLoading(true);
    try {
      await groupService.approveMember(group.idGroup, memberId);
      
      // Move from pending to members
      const pendingMember = pendingMembers.find(m => m.idUser.idUser === memberId);
      if (pendingMember) {
        setMembers(prev => [...prev, {
          ...pendingMember.idUser,
          role: 'USER'
        }]);
        setPendingMembers(prev => prev.filter(m => m.idUser.idUser !== memberId));
      }
      
      toast.success('Member approved successfully!');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve member');
    } finally {
      setLoading(false);
    }
  };

  const rejectMember = async (memberId) => {
    setLoading(true);
    try {
      await groupService.rejectMember(group.idGroup, memberId);
      setPendingMembers(prev => prev.filter(m => m.idUser.idUser !== memberId));
      toast.success('Member request rejected');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject member');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    setLoading(true);
    try {
      await groupService.removeMember(group.idGroup, memberId);
      setMembers(prev => prev.filter(m => m.idUser !== memberId));
      toast.success('Member removed successfully');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'USER':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'USER': return 'Member';
      case 'PENDING': return 'Pending';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Manage Group: {group?.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Members ({members.length})
          </button>
          {userRole === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({pendingMembers.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'add'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Add Members
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'members' && (
            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No members found</p>
              ) : (
                members.map((member) => (
                  <div key={member.idUser} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback>
                          {member.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 px-2 py-1 bg-white rounded text-sm">
                        {getRoleIcon(member.role)}
                        <span>{getRoleText(member.role)}</span>
                      </div>
                      {userRole === 'ADMIN' && member.role !== 'ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.idUser)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'pending' && userRole === 'ADMIN' && (
            <div className="space-y-3">
              {pendingMembers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending requests</p>
              ) : (
                pendingMembers.map((member) => (
                  <div key={member.idUser.idUser} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.idUser.avatarUrl} />
                        <AvatarFallback>
                          {member.idUser.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{member.idUser.name}</p>
                        <p className="text-sm text-gray-500">{member.idUser.email}</p>
                        <div className="flex items-center space-x-1 text-sm text-orange-600">
                          <Clock className="w-3 h-3" />
                          <span>Pending approval</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveMember(member.idUser.idUser)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rejectMember(member.idUser.idUser)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by email or phone
                </label>
                <Input
                  type="text"
                  placeholder="Enter email or phone number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Search Results</h4>
                  {searchResults.map((user) => (
                    <div key={user.idUser} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback>
                            {user.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addMember(user)}
                        disabled={loading}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {userRole === 'USER' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Member approval required
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        As a regular member, users you add will need admin approval before joining the group.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupManagement;