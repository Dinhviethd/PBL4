import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, MoreHorizontal, LogOut } from 'lucide-react';
import groupService from '@/services/group.service';
import { useContext } from 'react';
import NotificationContext from '@/contexts/NotificationContext';

const GroupsList = () => {
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
        setGroups(res.items || []);
        setTotal(res.total || 0);
      } catch (e) {
        console.error(e);
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
    return () => { mounted = false };
  }, [page, limit, searchTerm, sortOrder]);
  // note: effect deps include searchTerm and sortOrder, keep page as well

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
            <div key={group.idGroup} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">{(group.name || '').charAt(0)}</span>
                </div>
                <span className="text-sm text-gray-800">{group.name}</span>
              </div>
              <div className="relative">
                <button 
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setOpenDropdown(openDropdown === `group-${group.idGroup}` ? null : `group-${group.idGroup}`)}
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
                {openDropdown === `group-${group.idGroup}` && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button onClick={() => setConfirmLeave(group)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="w-4 h-4" />
                        Rời khỏi nhóm
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          ))}
        </div>
        {/* Pagination (show only when total > limit) */}
        {total > limit && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Hiển thị {groups.length} trong {total} kết quả</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50" disabled={page <= 1}>Prev</button>
              <div className="px-3 py-1 border rounded">{page}</div>
              <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded" disabled={page * limit >= total}>Next</button>
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
                    showSuccess('Rời nhóm', `Bạn đã rời nhóm "${confirmLeave.name}"`);
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
