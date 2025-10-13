import { Request, Response } from 'express';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/schemas/auth.schema';
import authService from '@/services/auth.service';
import { AppError } from '@/utils/error.response';

export const register = async (req: Request, res: Response) => {
        const validatedData = registerSchema.parse(req.body);

        const data = await authService.register({
            ...validatedData,
            userAgent: req.headers["user-agent"]
        });

        // set refreshToken vào cookie
        res.cookie("refreshToken", data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: process.env.REFRESH_EXPIRE ? parseInt(process.env.REFRESH_EXPIRE) * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            user: data.user,
            accessToken: data.accessToken
        });
};

export const login = async (req: Request, res: Response) => {
        const validatedData = loginSchema.parse(req.body);

        const data = await authService.login({
            ...validatedData,
            userAgent: req.headers["user-agent"]
        });

        // set refreshToken vào cookie
        res.cookie("refreshToken", data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            user: data.user,
            accessToken: data.accessToken
        });
    } ;

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

/** Controller cho refresh-token */
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            throw new AppError(401, "No refresh token provided");
        }

        const accessToken = await authService.refreshAccessToken(token);

        res.status(200).json({
            success: true,
            accessToken
        });
    } catch (error) {
        throw error;
    }
};
