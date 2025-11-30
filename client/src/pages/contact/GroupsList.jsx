import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, MoreHorizontal, LogOut, UserPlus, Eye, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import groupService from '@/services/group.service';
import { useContext } from 'react';
import NotificationContext from '@/contexts/NotificationContext';

const GroupsList = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(null);
  const { showSuccess, showError } = useContext(NotificationContext);

  const [groups, setGroups] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 15;
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await groupService.getUserGroupsPaginated(page, limit, searchTerm, sortOrder === 'asc' ? 'asc' : 'desc');
        
        if (!mounted) return;
        
        let mappedGroups;
        const items = res.items || res.data || [];
        
        if (items.length > 0 && items[0].group) {
          // Cấu trúc cũ: GroupUser objects
          mappedGroups = items.map(groupUser => ({
            id: groupUser.id,
            idGroup: groupUser.group.idGroup,
            name: groupUser.group.name,
            createdAt: groupUser.group.createdAt,
            createdBy: groupUser.group.createdBy,
            role: groupUser.role,
            statusGroup: groupUser.group.statusGroup
          }));
        } else {
          // Cấu trúc mới: Group objects trực tiếp
          mappedGroups = items.map(group => ({
            idGroup: group.idGroup,
            name: group.name,
            createdAt: group.createdAt,
            createdBy: group.createdBy,
            role: group.role || 'user',
            statusGroup: group.statusGroup
          }));
        }
        
        setGroups(mappedGroups);
        setTotal(res.total || 0);
      } catch (e) {
        console.error('❌ [GroupsList] Error loading groups:', e);
      }
    };
    load();

    // listen for group creation events and reload
    const onGroupsCreated = () => {
      // reset to first page and reload
      setPage(1);
      load();
    };
    window.addEventListener('groups:created', onGroupsCreated);
    return () => { mounted = false; window.removeEventListener('groups:created', onGroupsCreated); };
  }, [page, limit, searchTerm, sortOrder]);



  const handleGroupClick = (group) => {
    // Navigate to chat page and show this group
    // Store group ID in sessionStorage so ChatPage can load it
    sessionStorage.setItem('selectedGroupId', group.idGroup);
    navigate('/');
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Danh sách nhóm ({groups.length})</h2>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} type="text" placeholder="Tìm kiếm..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer" onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}>
            <span className="text-sm text-gray-600">Tên ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          {groups.map(group => (
            <div key={group.idGroup} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => handleGroupClick(group)}>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-blue-600">{(group.name || '').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{group.name}</p>
                  <p className="text-xs text-gray-500">Vai trò: {group.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sessionStorage.setItem('selectedGroupId', group.idGroup);
                    navigate('/');
                  }}
                  className="p-2 hover:bg-blue-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Mở tin nhắn"
                >
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </button>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === `group-${group.idGroup}` ? null : `group-${group.idGroup}`);
                    }}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                  {openDropdown === `group-${group.idGroup}` && (
                    <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-2">
                        <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                          <Eye className="w-5 h-5" />
                          Xem thông tin
                        </button>
                        <button 
                          onClick={() => {
                            setConfirmLeave(group);
                            setOpenDropdown(null);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-5 h-5" />
                          Rời khỏi nhóm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Hiển thị {groups.length} trong {total} kết quả</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50" disabled={page <= 1}>Trước</button>
              <div className="px-3 py-1 border rounded">{page}</div>
              <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded" disabled={page * limit >= total}>Tiếp</button>
            </div>
          </div>
        )}

        {/* Confirm leave modal */}
        {confirmLeave && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg p-6 w-80">
              <h3 className="text-lg font-semibold mb-4">Rời khỏi nhóm</h3>
              <p className="mb-6">Bạn có chắc muốn rời khỏi <span className="font-medium">{confirmLeave.name}</span> không?</p>
              <div className="flex justify-end gap-4">
                <button className="px-4 py-2 rounded-lg border" onClick={() => setConfirmLeave(null)}>Hủy</button>
                <button className="px-4 py-2 rounded-lg bg-red-600 text-white" onClick={async () => {
                  try {
                    await groupService.leaveGroup(confirmLeave.idGroup);
                    showSuccess('Thành công', `Bạn đã rời nhóm "${confirmLeave.name}"`);
                    setGroups(prev => prev.filter(g => g.idGroup !== confirmLeave.idGroup));
                    setConfirmLeave(null);
                  } catch (err) {
                    console.error(err);
                    const msg = err?.response?.data?.message || err?.message || 'Không thể rời nhóm';
                    showError('Lỗi', msg);
                  }
                }}>Rời</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GroupsList;
