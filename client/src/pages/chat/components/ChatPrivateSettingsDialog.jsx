import React from 'react';
import { useEffect, useState } from 'react';
import userService from '@/services/user.service';
import { getRelationStatus } from '@/services/friendShip.service';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import Button from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Info, UserX, UserCheck, Clock } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';

export const ChatPrivateSettingsDialog = ({ open, onClose, partner }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [relation, setRelation] = useState('none');

  useEffect(() => {
    let mounted = true;
    async function fetchInfoAndRelation() {
      if (open && partner?.idUser) {
        try {
          const res = await userService.getUserById(partner.idUser);
          if (!mounted) return;
          setUserInfo(res.data);
        } catch (err) {
          setUserInfo(null);
          console.log('Lỗi lấy thông tin user:', err);
        }
        try {
          const rel = await getRelationStatus(partner.idUser);
          if (!mounted) return;
          setRelation(rel?.status || 'none');
        } catch (err) {
          setRelation('none');
        }
      } else {
        setUserInfo(null);
        setRelation('none');
      }
    }
    fetchInfoAndRelation();
    return () => { mounted = false; };
  }, [open, partner]);

  const info = userInfo || partner;
  // Debug: log all info
  console.log('[ChatPrivateSettingsDialog] info:', info, 'relation:', relation);

  // Format birthday if available
  let birthday = '';
  if (info.birthday) {
    try {
      const date = new Date(info.birthday);
      birthday = date.toLocaleDateString('vi-VN');
    } catch {
      console.log('err');
    }
  }

  // Format gender
  let gender = '';
  if (info.gender) {
    if (info.gender === 'male' || info.gender === 'nam') gender = 'Nam';
    else if (info.gender === 'female' || info.gender === 'nữ') gender = 'Nữ';
    else gender = info.gender;
  }

  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-screen overflow-y-auto flex flex-col bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-xl px-6 py-4 mb-0 flex items-center gap-2">
          <Info className="w-6 h-6 text-white" />
          <DialogTitle className="text-white text-lg font-bold">Thông tin người dùng</DialogTitle>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-b-xl p-0 pt-5 pb-3 flex flex-col items-center shadow">
          <Avatar className="w-20 h-20 border-2 border-white shadow mb-1">
            <AvatarImage src={getAvatarUrl(info.avatarUrl)} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white text-2xl">
              {info.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">{info.name}</h3>
          <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-[220px] mx-auto space-y-2 mt-1">
              {info.email && (
                <div className="flex items-center text-gray-700 text-sm">
                  <span className="font-medium min-w-[80px]">Email:</span>
                  <span className="max-w-[200px] truncate break-words whitespace-nowrap" title={info.email}>{info.email}</span>
                </div>
              )}
              {birthday && (
                <div className="flex items-center text-gray-700 text-sm">
                  <span className="font-medium min-w-[80px]">Ngày sinh:</span>
                  <span>{birthday}</span>
                </div>
              )}
              {gender && (
                <div className="flex items-center text-gray-700 text-sm">
                  <span className="font-medium min-w-[80px]">Giới tính:</span>
                  <span>{gender}</span>
                </div>
              )}
              {info.phone && (
                <div className="flex items-center text-gray-700 text-sm">
                  <span className="font-medium min-w-[80px]">SĐT:</span>
                  <span>{info.phone}</span>
                </div>
              )}
              {info.status && (
                <div className="flex items-center text-gray-700 text-sm">
                  <span className="font-medium min-w-[80px]">Trạng thái:</span>
                  <span>{info.status}</span>
                </div>
              )}
              {info.address && (
                <div className="flex items-center text-gray-700 text-sm">
                  <span className="font-medium min-w-[80px]">Địa chỉ:</span>
                  <span>{info.address}</span>
                </div>
              )}
            </div>
            {/* Mối quan hệ - hiển thị đẹp */}
            <div className="mt-5 flex flex-col items-center gap-2 w-full">
              <span className="font-semibold text-gray-700 text-center text-sm">Mối quan hệ với bạn</span>
              <div className="flex justify-center gap-2 flex-wrap w-full">
                {relation === 'friend' && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <UserCheck className="w-4 h-4" />
                    Bạn bè
                  </span>
                )}
                {relation === 'pending' && (
                  <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <Clock className="w-4 h-4 animate-spin" />
                    Đang chờ xác nhận
                  </span>
                )}
                {relation === 'blocked' && (
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <UserX className="w-4 h-4" />
                    Đã chặn
                  </span>
                )}
                {(relation === 'none' || !relation) && (
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <UserX className="w-4 h-4" />
                    Chưa là bạn bè
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center pt-4 pb-2">
          <Button variant="outline" onClick={onClose} className="px-6 py-1 rounded-full font-semibold text-base shadow bg-white hover:bg-blue-50 transition">Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatPrivateSettingsDialog;
