import { z } from "zod"

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(50),
    confirmPassword: z.string().min(6).max(50),
    name: z.string().min(3).max(100),
    phone: z.string().refine(
        (value) => !value || (value.length >= 10 && value.length <= 15),
        { message: "Số điện thoại không hợp lệ (10-15 chữ số)" }
    ).optional().or(z.literal("")),
    avatarUrl: z.string().url().optional()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(50)
});

export const forgotPasswordSchema = z.object({
    email: z.string().email()
});

export const resetPasswordSchema = z.object({
    token: z.string(),
    newPassword: z.string().min(6).max(50),
    confirmPassword: z.string().min(6).max(50)
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const resetPasswordRequestSchema = z.object({
    email: z.string().email(),
    newPassword: z.string().min(6).max(50),
    confirmPassword: z.string().min(6).max(50)
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const confirmPasswordResetSchema = z.object({
    verificationId: z.number(),
    email: z.string().email()
});



