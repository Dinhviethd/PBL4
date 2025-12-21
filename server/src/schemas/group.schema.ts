import { z } from 'zod';

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  memberIds: z.array(z.number().int().positive()).min(1)
});

export const AddMemberSchema = z.object({
  userId: z.number().int().positive()
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional()
});

export type CreateGroupDTO = z.infer<typeof CreateGroupSchema>;
export type AddMemberDTO = z.infer<typeof AddMemberSchema>;
export type UpdateGroupDTO = z.infer<typeof UpdateGroupSchema>;