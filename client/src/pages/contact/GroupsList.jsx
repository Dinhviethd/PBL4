import React, { useState, useEffect } from 'react';
import { GroupSettingsDialog } from '@/pages/chat/components/GroupSettingsDialog';
import { Search, Filter, ChevronDown, MoreHorizontal, LogOut, UserPlus, Eye, MessageSquare } from 'lucide-react';
import groupService from '@/services/group.service';
import { useContext } from 'react';
import NotificationContext from '@/contexts/NotificationContext';

const GroupsList = () => {
  const [confirmLeave, setConfirmLeave] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
        const res = await groupService.getUserGroupsPaginated(page, limit, searchTerm, sortOrder);
        if (!mounted) return;
        let mappedGroups;
        const items = res.items || res.data || [];
        if (items.length > 0 && items[0].group) {
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
    const onGroupsCreated = () => {
      setPage(1);
      load();
    };
    window.addEventListener('groups:created', onGroupsCreated);
    return () => { mounted = false; window.removeEventListener('groups:created', onGroupsCreated); };
  }, [page, limit, searchTerm, sortOrder]);


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
          {groups.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
              {searchTerm ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <div className="text-lg font-medium">Không có nhóm phù hợp</div>
                  <div className="text-sm mt-1">Hãy thử từ khóa khác.</div>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <div className="text-lg font-medium">Chưa có nhóm nào</div>
                  <div className="text-sm mt-1">Bạn chưa tham gia nhóm nào.</div>
                </>
              )}
            </div>
          ) : (
            [...groups]
              .sort((a, b) => {
                const an = (a.name || '').toLowerCase();
                const bn = (b.name || '').toLowerCase();
                if (an < bn) return sortOrder === 'asc' ? -1 : 1;
                if (an > bn) return sortOrder === 'asc' ? 1 : -1;
                return 0;
              })
              .map(group => (
                <div key={group.idGroup} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
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
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroup(group);
                              setIsDialogOpen(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreHorizontal className="w-5 h-5 text-gray-400" />
                          </button>
                        </div>
                        {/* GroupSettingsDialog - render ngoài danh sách nhóm */}
                        {isDialogOpen && selectedGroup && (
                          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                            <div id="group-settings-dialog">
                              <GroupSettingsDialog
                                open={isDialogOpen}
                                onClose={() => {
                                  setIsDialogOpen(false);
                                  setSelectedGroup(null);
                                }}
                                group={selectedGroup}
                              />
                            </div>
                          </div>
                        )}
                  </div>
                </div>
              ))
          )}
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
      </div>
    </div>
  );
};

export default GroupsList;
