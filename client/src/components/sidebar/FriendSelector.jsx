import React from 'react';

export default function FriendSelector({ friends = [], selected = [], onToggle }) {
  return (
    <div>
      {friends.length === 0 ? (
        <p className="text-sm text-gray-500">Không có bạn bè hoặc đang tải...</p>
      ) : (
        friends.map((f) => (
          <label key={`friend-${f.idUser}`} className="flex items-center gap-2 text-sm mb-1 cursor-pointer hover:bg-gray-100 rounded p-1">
            <input type="checkbox" checked={selected.some(u => u.idUser === f.idUser)} onChange={() => onToggle(f)} className="w-4 h-4 text-blue-500 rounded" />
            <img src={f.avatarUrl || '/images/avatar-default-icon.png'} alt={f.name} className="w-6 h-6 rounded-full object-cover" />
            <span>{f.name}</span>
          </label>
        ))
      )}
    </div>
  );
}
