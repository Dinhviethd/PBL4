import { Request, Response } from 'express';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/schemas/auth.schema';
import authService from '@/services/auth.service';
import { AppError } from '@/utils/error.response';

export const register = async (req: Request, res: Response) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        
        const data = await authService.register({
            ...validatedData,
            userAgent: req.headers["user-agent"]
        });

        res.status(201).json({
            success: true,
            data
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            throw new AppError(400, 'Validation failed');
        }
        throw error;
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        
        const data = await authService.login({
            ...validatedData,
            userAgent: req.headers["user-agent"]
        });

        res.status(200).json({
            success: true,
            data
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            throw new AppError(400, 'Validation failed');
        }
        throw error;
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        
        await authService.forgotPassword(email);

        res.status(200).json({
            success: true,
            message: "If an account exists with this email, you will receive password reset instructions."
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            throw new AppError(400, 'Validation failed');
        }
        throw error;
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const validatedData = resetPasswordSchema.parse(req.body);
        
        await authService.resetPassword(validatedData.token, validatedData.newPassword);

        res.status(200).json({
            success: true,
            message: "Password has been successfully reset"
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            throw new AppError(400, 'Validation failed');
        }
        throw error;
    }
};