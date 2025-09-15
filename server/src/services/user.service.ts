import { User } from "@/models/users.model";
import { Repository } from "typeorm";
import { AppDataSource } from "@/configs/database.config";
import { AppError } from "@/utils/error.response";
import { UpdateUserDTO, UserResponse } from '@/DTOs/user.dto';

class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getMyInfo(userIdFromToken: number): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { idUser: userIdFromToken },
    });
    if (!user) throw new AppError(404, "User not found");

    return {
      id: user.idUser,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }

  async updateMyInfo(userIdFromToken: number, data: UpdateUserDTO): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { idUser: userIdFromToken },
    });
    if (!user) throw new AppError(404, "User not found");

    this.userRepository.merge(user, data);
    const saved = await this.userRepository.save(user);

    return {
      id: saved.idUser,
      name: saved.name,
      email: saved.email,
      avatarUrl: saved.avatarUrl,
      phone: saved.phone,
      createdAt: saved.createdAt,
    };
  }

  async deleteMyAccount(userIdFromToken: number): Promise<boolean> {
    const result = await this.userRepository.delete({ idUser: userIdFromToken });
    if (result.affected === 0) throw new AppError(404, "User not found");
    return true;
  }
}

export default new UserService();
