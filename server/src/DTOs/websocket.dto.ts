import { User } from '@/models/users.model';
import { Group } from '@/models/group.model';
import { GroupUser } from '@/models/group_user';
import { Message } from '@/models/message.model';
import { MessageType, StatusUser, UserRole } from '@/constants/constants';
import { WebSocket } from 'ws';

export interface WebSocketMessage {
  type: 'join_private_chat' | 'join_group_chat' | 'leave_private_chat' | 'leave_group_chat' | 'send_private_message' | 'send_group_message' | 'typing_private' | 'typing_group' | 'stop_typing_private' | 'stop_typing_group' | 'message_received' | 'user_joined' | 'user_left' | 'private_chat_history' | 'group_chat_history';
  userId1?: number; // For private chat
  userId2?: number; // For private chat
  groupId?: number; // For group chat
  message?: Message;
  userId?: number;
  data?: MessageData;
}

export interface MessageData {
  content: string;
  type: MessageType;
  fileURL?: string;
}

export interface WebSocketClient {
  ws: WebSocket;
  userId: number;
  privateChatRooms: Set<string>; // Set of "userId1_userId2" format
  groupChatRooms: Set<number>; 
}

export interface PrivateChatRoom {
  id: string; 
  participants: Set<number>;
}

export interface GroupChatRoom {
  id: number; 
  participants: Set<number>;
}

export interface CreateMessageData {
  content: string;
  type: MessageType;
  fileURL?: string;
}
