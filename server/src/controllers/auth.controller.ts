import { Request, Response } from 'express';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/schemas/auth.schema';
import authService from '@/services/auth.service';

export const register = async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);
    
    const data = await authService.register({
        ...validatedData,
        userAgent: req.headers["user-agent"]
    });

    res.status(201).json({
        success: true,
        data
    });
};

export const login = async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);
    
    const data = await authService.login({
        ...validatedData,
        userAgent: req.headers["user-agent"]
    });

    res.json({
        success: true,
        data
    });
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    
    await authService.forgotPassword(email);

    res.json({
        success: true,
        message: "If an account exists with this email, you will receive password reset instructions."
    });
};

export const resetPassword = async (req: Request, res: Response) => {
    const validatedData = resetPasswordSchema.parse(req.body);
    
    await authService.resetPassword(validatedData.token, validatedData.newPassword);

    res.json({
        success: true,
        message: "Password has been successfully reset"
    });
};