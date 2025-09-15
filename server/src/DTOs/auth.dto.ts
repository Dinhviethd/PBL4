export interface RegisterDTO {
    email: string;
    password: string;
    fullname: string;
    phone?: string;
    avatarUrl?: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface ForgotPasswordDTO {
    email: string;
}

export interface ResetPasswordDTO {
    token: string;
    newPassword: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        email: string;
        fullname: string;
        avatarUrl?: string;
        createdAt: Date;
    }
}