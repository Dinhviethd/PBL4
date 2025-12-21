import { z } from 'zod';
import { MessageType } from '@/constants/constants';

export const SendPrivateMessageSchema = z.object({
  receiverId: z.number().int().positive(),
  content: z.string().min(1).max(5000),
  type: z.nativeEnum(MessageType).default(MessageType.TEXT),
  fileURL: z.string().regex(/^https?:\/\/[^\s]+$/, "Invalid URL").optional()
});

export const SendGroupMessageSchema = z.object({
  groupId: z.number().int().positive(),
  content: z.string().min(1).max(5000),
  type: z.nativeEnum(MessageType).default(MessageType.TEXT),
  fileURL: z.string().regex(/^https?:\/\/[^\s]+$/, "Invalid URL").optional()
});

// Schema phân trang
export const GetMessagesSchema = z.object({
  page: z.preprocess(
    (val) => val ? parseInt(val as string) : 1,
    z.number().int().min(1).default(1)
  ),
  limit: z.preprocess(
    (val) => val ? parseInt(val as string) : 20,
    z.number().int().min(1).max(100).default(20)
  ),
  search: z.string().optional()
});

// Schema lấy tin nhắn cũ hơn
export const GetOlderMessagesSchema = z.object({
  lastMessageId: z.number().int().positive(),
  limit: z.number().int().min(1).max(50).default(20)
});

export type SendPrivateMessageDTO = z.infer<typeof SendPrivateMessageSchema>;
export type SendGroupMessageDTO = z.infer<typeof SendGroupMessageSchema>;
export type GetMessagesDTO = z.infer<typeof GetMessagesSchema>;
export type GetOlderMessagesDTO = z.infer<typeof GetOlderMessagesSchema>;