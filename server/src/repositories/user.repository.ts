import { AppDataSource } from "@/configs/database.config";
import { Repository } from "typeorm";
import { User } from "@/models/users.model";
import { StatusUser } from "@/constants/constants";
import { UserResponse } from "@/DTOs/user.dto";
import { UpdateUserDTO } from "@/DTOs/user.dto";

export class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async findById(userId: number): Promise<UserResponse | null> {
  const user = await this.repo.findOne({ where: { idUser: userId } });
  if (!user) return null;

  const response: UserResponse = {
    idUser: user.idUser,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    gender: user.gender,
    birthday: user.birthday
    ? (user.birthday instanceof Date
        ? user.birthday.toISOString().split("T")[0]
        : user.birthday) 
    : undefined,
    createdAt: user.createdAt,
  };

  return response;
}


  async findByEmail(email: string): Promise<User | null> {
    return await this.repo.findOne({ where: { email } });
  }

  async save(user: Partial<User>): Promise<User> {
    return await this.repo.save(user);
  }

async update(userId: number, data: Partial<User>): Promise<UpdateUserDTO | null> {
  await this.repo.update({ idUser: userId }, data);
  const updatedUser = await this.repo.findOne({ where: { idUser: userId } });
  if (!updatedUser) return null;

  const dto: UpdateUserDTO = {
    name: updatedUser.name,
    avatarUrl: updatedUser.avatarUrl,
    password: updatedUser.password,
    phone: updatedUser.phone,
    gender: updatedUser.gender,
    birthday: updatedUser.birthday
    ? (updatedUser.birthday instanceof Date
        ? updatedUser.birthday.toISOString().split("T")[0]
        : updatedUser.birthday) 
    : undefined,
  };

  return dto;
}


  async delete(userId: number) {
    return await this.repo.delete({ idUser: userId });
  }

  async getStatus(userId: number): Promise<StatusUser | null> {
    const user = await this.repo.findOne({
      where: { idUser: userId },
      select: ["status"],
    });
    return user?.status ?? null;
  }
}
