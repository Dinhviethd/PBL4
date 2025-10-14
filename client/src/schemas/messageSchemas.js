// src/schemas/messageSchemas.js
import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'VIDEO']).default('TEXT'),
  fileURL: z.string().url().optional()
});

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name too long'),
  memberIds: z.array(z.number()).min(1, 'At least one member is required')
});