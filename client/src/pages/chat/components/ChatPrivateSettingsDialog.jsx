import React from 'react';
import { useEffect, useState } from 'react';
import userService from '@/services/user.service';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import Button from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';

export const ChatPrivateSettingsDialog = ({ open, onClose, partner }) => {
  const [userInfo, setUserInfo] = useState(null);
  useEffect(() => {
    if (open && partner?.idUser) {
      userService.getUserById(partner.idUser)
        .then(res => {
          setUserInfo(res.data);
        })
        .catch(err => {
          setUserInfo(null);
          console.log('Lỗi lấy thông tin user:', err);
        });
    } else {
      setUserInfo(null);
    }
  }, [open, partner]);

  const info = userInfo || partner;
  // Debug: log all info
  console.log('[ChatPrivateSettingsDialog] info:', info);

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
      <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 -mx-6 -mt-6 px-6 py-5 mb-4 rounded-t-xl">
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
            <Info className="w-6 h-6" />
            Thông tin người dùng
          </DialogTitle>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-xl border-2 border-gray-100 p-6 shadow-sm flex items-center gap-6">
          <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
            <AvatarImage src={getAvatarUrl(info.avatarUrl)} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white text-3xl">
              {info.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{info.name}</h3>
            <div className="space-y-2">
              {info.email && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-700 min-w-[60px]">Email:</span>
                  <span className="text-gray-800 break-all max-w-[180px] whitespace-pre-line">{info.email}</span>
                </div>
              )}
              {birthday && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-24">Ngày sinh:</span>
                  <span className="text-gray-800">{birthday}</span>
                </div>
              )}
              {gender && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-24">Giới tính:</span>
                  <span className="text-gray-800">{gender}</span>
                </div>
              )}
              {info.phone && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-24">SĐT:</span>
                  <span className="text-gray-800">{info.phone}</span>
                </div>
              )}
              {info.status && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-24">Trạng thái:</span>
                  <span className="text-gray-800">{info.status}</span>
                </div>
              )}
              {info.address && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-24">Địa chỉ:</span>
                  <span className="text-gray-800">{info.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} className="px-6">Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatPrivateSettingsDialog;
