import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Button from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner"
import groupService from '@/services/group.service';
import useChatStore from '@/zustand/chatStore';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string()
    .min(1, 'Tên nhóm không được để trống')
    .max(50, 'Tên nhóm không được quá 50 ký tự')
});

export const CreateGroupDialog = ({ open, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { addGroup, addConversation } = useChatStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    try {
      createGroupSchema.parse({ name: groupName });
      setErrors({});
    } catch (error) {
      const fieldErrors = {};
      error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await groupService.createGroup(groupName);
      
      // Add to groups store
      addGroup(response.data);
      
      // Add to conversations
      addConversation({
        type: 'group',
        groupId: response.data.idGroup,
        group: response.data,
        lastMessage: null,
        lastMessageTime: response.data.createdAt,
        unreadCount: 0
      });

      toast('Nhóm đã được tạo thành công');

      // Reset and close
      setGroupName('');
      onClose();
    } catch (error) {
      toast('Lỗi Không thể tạo nhóm',);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo nhóm mới</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Tên nhóm</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : 'Tạo nhóm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};