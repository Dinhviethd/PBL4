
export interface UserResponse {
  idUser: number;
  name?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  gender?: string;
  birthday?: string;
  createdAt?: Date;
}


export interface UpdateUserDTO {
  name?: string;
  avatarUrl?: string;
  password?: string;
  phone?: string;
  gender?: string;
  birthday?: string;
}
