import { User } from '@/models/users.model';
import { RegisterDTO, LoginDTO, AuthResponse } from '@/DTOs/auth.dto';
import { Repository } from "typeorm";
import { AppDataSource } from "@/configs/database.config";
import { AppError } from '@/utils/error.response';
import jwt from 'jsonwebtoken';
import { hashPassword, passwordCompare } from '@/utils/password';
import { VerifiedCode } from '@/models/verification.model';
import dayjs from "dayjs";
import { verifiedCodeType, StatusUser } from '@/constants/constants';
import emailService from '@/services/email.service';
import notificationService from '@/services/notification.service';

class AuthService {
    private userRepository: Repository<User>;
    private verifiedCodeRepository: Repository<VerifiedCode>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.verifiedCodeRepository = AppDataSource.getRepository(VerifiedCode);
    }

    async register(data: RegisterDTO & { userAgent?: string }): Promise<AuthResponse> {
        const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
        if (existingUser) throw new AppError(400, "Email already exists");

        const hashedPassword = await hashPassword(data.password);

        const user = await this.userRepository.save({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            phone: data.phone,
            avatarUrl: data.avatarUrl,
            status: StatusUser.OFFLINE
        });

        const { accessToken, refreshToken } = this.generateTokens(user);

        return {
            user: {
                id: user.idUser,
                email: user.email || '',
                name: user.name || '',
                avatarUrl: user.avatarUrl,
                phone: user.phone,
                gender: user.gender,
                birthday: user.birthday ? (typeof user.birthday === 'string' ? user.birthday : user.birthday.toISOString().slice(0, 10)) : undefined,
                createdAt: user.createdAt || new Date()
            },
            accessToken,
            refreshToken
        };
    }

    async login(data: LoginDTO & { userAgent?: string }): Promise<AuthResponse> {
        const user = await this.userRepository.findOne({ where: { email: data.email } });
        if (!user) throw new AppError(401, "Invalid credentials");

        const isPasswordValid = await passwordCompare(data.password, user.password || '');
        if (!isPasswordValid) throw new AppError(401, "Invalid credentials");

        // Auto-reactivate locked accounts on successful login
        const statusToUpdate = user.status === StatusUser.LOCKED ? StatusUser.ONLINE : StatusUser.ONLINE;
        
        await this.userRepository.update(user.idUser, {
            lastLogin: new Date(),
            status: statusToUpdate
        });

        const { accessToken, refreshToken } = this.generateTokens(user);

        return {
            user: {
                id: user.idUser,
                email: user.email || '',
                name: user.name || '',
                avatarUrl: user.avatarUrl,
                phone: user.phone,
                gender: user.gender,
                birthday: user.birthday ? (typeof user.birthday === 'string' ? user.birthday : user.birthday.toISOString().slice(0, 10)) : undefined,
                createdAt: user.createdAt || new Date()
            },
            accessToken,
            refreshToken
        };
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { email } });

        if (user) {
            const token = this.generateResetToken();

            await this.verifiedCodeRepository.save({
                ExpiredAt: dayjs().add(24, 'hour').toDate(),
                type: verifiedCodeType.PasswordVerification,
                user: user
            });

            console.log(`Reset token for ${email}: ${token}`);
        }
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const verification = await this.verifiedCodeRepository.findOne({
            where: { type: verifiedCodeType.PasswordVerification },
            relations: ['user']
        });

        if (!verification || verification.ExpiredAt < new Date()) {
            throw new AppError(400, "Invalid or expired reset token");
        }

        const hashedPassword = await hashPassword(newPassword);

        if (verification.user) {
            await this.userRepository.update(verification.user.idUser, { password: hashedPassword });
            // Tạo thông báo đổi mật khẩu thành công
            try {
                await notificationService.createPasswordChangeNotification(verification.user.idUser);
            } catch (error) {
                console.error('Failed to create password change notification:', error);
            }
        }

        await this.verifiedCodeRepository.delete(verification.idVerifiedCode);
    }

    async resetPasswordRequest(email: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            throw new AppError(404, "User not found with this email address");
        }

        // Hash the new password to store temporarily
        const hashedNewPassword = await hashPassword(newPassword);
        
        // Store verification record with the hashed new password
        const verification = await this.verifiedCodeRepository.save({
            ExpiredAt: dayjs().add(24, 'hour').toDate(),
            type: verifiedCodeType.PasswordVerification,
            code: hashedNewPassword, // Store hashed password temporarily
            user: user
        });

        // Create confirmation link
        const confirmationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/confirm-password-reset?token=${verification.idVerifiedCode}&email=${encodeURIComponent(email)}`;
        
        try {
            // Send email using email service
            await emailService.sendPasswordResetConfirmationEmail(email, confirmationLink);
        } catch (error) {
            // If email fails, still log the link for development
            console.log(`Password reset confirmation email for ${email}:`);
            console.log(`Click this link to confirm your password change: ${confirmationLink}`);
            console.log(`Verification ID: ${verification.idVerifiedCode}`);
            
            // Don't throw error here, just log it
            console.error('Failed to send email, but link is logged above');
        }
    }

    async confirmPasswordReset(verificationId: number, email: string): Promise<void> {
        const verification = await this.verifiedCodeRepository.findOne({
            where: { 
                idVerifiedCode: verificationId,
                type: verifiedCodeType.PasswordVerification 
            },
            relations: ['user']
        });

        if (!verification || verification.ExpiredAt < new Date()) {
            throw new AppError(400, "Invalid or expired verification link");
        }

        if (verification.user.email !== email) {
            throw new AppError(400, "Invalid verification link");
        }

        if (!verification.code) {
            throw new AppError(400, "Invalid verification data");
        }

        // Use the stored hashed password
        await this.userRepository.update(verification.user.idUser, { password: verification.code });
        
        // Tạo thông báo đổi mật khẩu thành công
        try {
            await notificationService.createPasswordChangeNotification(verification.user.idUser);
        } catch (error) {
            console.error('Failed to create password change notification:', error);
            // Không throw error để không ảnh hưởng đến quá trình đổi mật khẩu
        }
        
        // await this.verifiedCodeRepository.delete(verification.idVerifiedCode);
    }

    /** Sinh accessToken + refreshToken */
    private generateTokens(user: User) {
        const accessToken = jwt.sign(
            { userId: user.idUser },
            process.env.JWT_ACCESS_SECRET || 'access_secret',
            { expiresIn: '30m' }
        );

        const refreshToken = jwt.sign(
            { userId: user.idUser },
            process.env.JWT_REFRESH_SECRET || 'refresh_secret',
            { expiresIn: '3d' }
        );

        return { accessToken, refreshToken };
    }

    /** Dùng refreshToken để cấp lại accessToken */
    async refreshAccessToken(refreshToken: string): Promise<string> {
        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET as string
            ) as { userId: number };

            const user = await this.userRepository.findOne({ where: { idUser: decoded.userId } });
            if (!user) throw new AppError(401, "User not found");

            const accessToken = jwt.sign(
                { userId: user.idUser },
                process.env.JWT_ACCESS_SECRET || 'access_secret',
                { expiresIn: '30m' }
            );

            return accessToken;
        } catch (err) {
            throw new AppError(403, "Invalid refresh token");
        }
    }

    async logout(userId: number): Promise<void> {
        // Cập nhật status user thành OFFLINE
        await this.userRepository.update(userId, {
            status: StatusUser.OFFLINE
        });
    }

    private generateResetToken(): string {
        return Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
    }
}

export default new AuthService();
