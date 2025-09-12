import z from "zod"
export const registerSchema= z.object({
    email: z.email().min(1).max(255),
    password: z.string().min(1).max(20),
    confirmPassword: z.string().min(1).max(20),
    userAgent: z.string().optional()
}).refine((val) => val.password === val.confirmPassword, { 
    message: "Password do not match",
    path: ["confirmPassword"],
})



