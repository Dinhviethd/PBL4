import React from 'react';
import { getAvatarUrl } from '@/lib/utils';

export default function UserLookup({ results = [], selected = [], onToggle }) {
  return (
    <div>
      {results.map(u => (
        <label key={`search-${u.idUser}`} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 rounded p-1">
          <input type="checkbox" checked={selected.some(s => s.idUser === u.idUser)} onChange={() => onToggle(u)} className="w-4 h-4 text-blue-500 rounded" />
          <img src={getAvatarUrl(u.avatarUrl)} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
          <span>{u.name}</span>
        </label>
      ))}
    </div>
  );
}
