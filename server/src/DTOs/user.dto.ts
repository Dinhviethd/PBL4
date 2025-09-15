
export interface UserResponse {
  id: number;
  name?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  createdAt?: Date;
}


export interface UpdateUserDTO {
  name?: string;
  avatarUrl?: string;
  password?: string;
  phone?: string;
}
