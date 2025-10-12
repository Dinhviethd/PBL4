import { User } from "@/models/users.model";
import { Repository } from "typeorm";
import { AppDataSource } from "@/configs/database.config";
import { AppError } from "@/utils/error.response";
import { UpdateUserDTO, UserResponse } from '@/DTOs/user.dto';
import { deleteOldAvatar } from '@/middlewares/upload.middleware';
import { StatusUser } from '@/constants/constants';
import { passwordCompare } from '@/utils/password';
import notificationService from '@/services/notification.service';

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
      gender: user.gender,
      birthday: user.birthday ? (typeof user.birthday === 'string' ? user.birthday : user.birthday.toISOString().slice(0, 10)) : undefined,
      createdAt: user.createdAt,
    };
  }

  async updateMyInfo(userIdFromToken: number, data: UpdateUserDTO): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { idUser: userIdFromToken },
    });
    if (!user) throw new AppError(404, "User not found");

    // Đảm bảo birthday là undefined nếu rỗng hoặc undefined (đúng với DTO)
    if (data.birthday === "" || data.birthday === undefined) {
      delete data.birthday;
    }

    this.userRepository.merge(user, data);
    const saved = await this.userRepository.save(user);

    return {
      id: saved.idUser,
      name: saved.name,
      email: saved.email,
      avatarUrl: saved.avatarUrl,
      phone: saved.phone,
      gender: saved.gender,
      birthday: saved.birthday ? (typeof saved.birthday === 'string' ? saved.birthday : saved.birthday.toISOString().slice(0, 10)) : undefined,
      createdAt: saved.createdAt,
    };
  }

  async updateAvatar(userIdFromToken: number, avatarPath: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { idUser: userIdFromToken },
    });
    if (!user) throw new AppError(404, "User not found");

    // Xóa avatar cũ nếu có
    if (user.avatarUrl) {
      deleteOldAvatar(user.avatarUrl);
    }

    // Cập nhật đường dẫn avatar mới
    const avatarUrl = `/upload/avatars/${avatarPath}`;
    await this.userRepository.update(userIdFromToken, { avatarUrl });

    // Lấy user data mới
    const updatedUser = await this.userRepository.findOne({
      where: { idUser: userIdFromToken },
    });

    if (!updatedUser) throw new AppError(404, "User not found after update");

    return {
      id: updatedUser.idUser,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl,
      phone: updatedUser.phone,
      gender: updatedUser.gender,
      birthday: updatedUser.birthday ? (typeof updatedUser.birthday === 'string' ? updatedUser.birthday : updatedUser.birthday.toISOString().slice(0, 10)) : undefined,
      createdAt: updatedUser.createdAt,
    };
  }

  async deleteMyAccount(userIdFromToken: number, password: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { idUser: userIdFromToken },
    });
    if (!user) throw new AppError(404, "User not found");

    // Validate password
    const isPasswordValid = await passwordCompare(password, user.password || '');
    if (!isPasswordValid) throw new AppError(401, "Mật khẩu không đúng");

    // Xóa avatar nếu có
    if (user.avatarUrl) {
      deleteOldAvatar(user.avatarUrl);
    }

    const result = await this.userRepository.delete({ idUser: userIdFromToken });
    if (result.affected === 0) throw new AppError(404, "User not found");
    return true;
  }

  async getUserById(userIdFromToken: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { idUser: userIdFromToken },
    });
  }

  async updatePassword(userIdFromToken: number, hashedPassword: string): Promise<boolean> {
    const result = await this.userRepository.update(
      { idUser: userIdFromToken },
      { password: hashedPassword }
    );
    if (result.affected === 0) throw new AppError(404, "User not found");
    
    // Tạo thông báo đổi mật khẩu thành công
    try {
      await notificationService.createPasswordChangeNotification(userIdFromToken);
    } catch (error) {
      console.error('Failed to create password change notification:', error);
      // Không throw error để không ảnh hưởng đến quá trình đổi mật khẩu
    }
    
    return true;
  }

  async deactivateAccount(userIdFromToken: number, password: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { idUser: userIdFromToken },
    });
    if (!user) throw new AppError(404, "User not found");

    // Validate password
    const isPasswordValid = await passwordCompare(password, user.password || '');
    if (!isPasswordValid) throw new AppError(401, "Mật khẩu không đúng");

    const result = await this.userRepository.update(
      { idUser: userIdFromToken },
      { status: StatusUser.LOCKED }
    );
    
    if (result.affected === 0) throw new AppError(404, "User not found");
    return true;
  }

  async reactivateAccount(userIdFromToken: number): Promise<boolean> {
    const result = await this.userRepository.update(
      { idUser: userIdFromToken },
      { status: StatusUser.ONLINE }
    );
    
    if (result.affected === 0) throw new AppError(404, "User not found");
    return true;
  }

  async getAccountStatus(userIdFromToken: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { idUser: userIdFromToken },
      select: ['status']
    });
    
    if (!user) throw new AppError(404, "User not found");
    return user.status || StatusUser.OFFLINE;
  }
}

export default new UserService();
