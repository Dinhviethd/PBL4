import { z } from "zod";

export const updateUserSchema = z.object({
  fullname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  birthday: z.string().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
});