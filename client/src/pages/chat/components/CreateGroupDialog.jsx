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
import { toast } from "sonner";
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
  
  const { addGroup, addConversation, setActiveConversation } = useChatStore();

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
      const newGroup = response.data;
      
      
      // Add to groups store
      addGroup(newGroup);
      
      // Create conversation object
      const newConversation = {
        type: 'group',
        groupId: newGroup.idGroup,
        group: newGroup,
        lastMessage: null,
        lastMessageTime: newGroup.createdAt || new Date().toISOString(),
        lastMessageType: null,
        unreadCount: 0,
        memberCount: 1
      };
            
      // Add to conversations
      addConversation(newConversation);
      
      // Set as active conversation
      setActiveConversation(newConversation);

      // KHÔNG GỌI loadInitialData ở đây nữa để tránh duplicate

      toast.success('Thành công', {
        description: `Nhóm "${newGroup.name}" đã được tạo thành công`
      });

      // Reset and close
      setGroupName('');
      onClose();
    } catch (error) {
      console.error('Create group error:', error);
      toast.error('Lỗi', {
        description: error.message || 'Không thể tạo nhóm'
      });
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