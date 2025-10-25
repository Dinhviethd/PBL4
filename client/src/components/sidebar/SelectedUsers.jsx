import React from 'react';

export default function SelectedUsers({ users = [], onRemove }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {users.map(u => (
        <div key={`selected-${u.idUser}`} className="flex items-center gap-1 bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs">
          <img src={u.avatarUrl || '/images/avatar-default-icon.png'} className="w-5 h-5 rounded-full object-cover" />
          <span>{u.name}</span>
          <button onClick={() => onRemove(u.idUser)} className="ml-1 text-red-500 font-bold">×</button>
        </div>
      ))}
    </div>
  );
}
