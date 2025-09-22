export interface registerDTO{
    username: string, 
    password: string,
    fullname: string,
    avatarUrl?: string,
}
export type createAccount = {
    email: string,
    password: string,
    userAgent?: string
}
export interface loginDTOResponse{
    accessToken: string,
    refreshToken: string,
    user: {
        username: string,
        createdAt: Date,
    }
}
