import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  birthday: z.string().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
});