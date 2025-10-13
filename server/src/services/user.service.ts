
import { User } from "@/models/users.model";
import { Repository } from "typeorm";
import { AppDataSource } from "@/configs/database.config";
import { AppError } from "@/utils/error.response";
import { UpdateUserDTO, UserResponse } from "@/DTOs/user.dto";
import { uploadToCloudinary, deleteFromCloudinary } from "@/utils/upload"
import { StatusUser } from "@/constants/constants";
import { passwordCompare } from "@/utils/password";

class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  private mapUserResponse(user: User): UserResponse {
    return {
      idUser: user.idUser,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      gender: user.gender,
      birthday:
        user.birthday instanceof Date
          ? user.birthday.toISOString().slice(0, 10)
          : user.birthday || undefined,
      createdAt: user.createdAt,
    };
  }

  async getMyInfo(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    if (!user) throw new AppError(404, "Không tìm thấy người dùng");
    return this.mapUserResponse(user);
  }

  async updateMyInfo(userId: number, data: UpdateUserDTO): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    if (!user) throw new AppError(404, "Không tìm thấy người dùng");

    if (data.birthday === "" || data.birthday === undefined) {
      delete data.birthday;
    }

    this.userRepository.merge(user, data);
    const updated = await this.userRepository.save(user);
    return this.mapUserResponse(updated);
  }

  async updateAvatar(userId: number, filePath: string, folder: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    if (!user) throw new AppError(404, "Không tìm thấy người dùng");

    // Upload lên Cloudinary
    const result = await uploadToCloudinary(filePath, folder);

    // Xóa avatar cũ (nếu có)
    if (user.avatarUrl) {
      const publicId = this.extractPublicId(user.avatarUrl);
      if (publicId) await deleteFromCloudinary(publicId);
    }

    user.avatarUrl = result.secure_url;
    await this.userRepository.save(user);
    return this.mapUserResponse(user);
  }

  async deleteMyAccount(userId: number, password: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    if (!user) throw new AppError(404, "Không tìm thấy người dùng");

    const isPasswordValid = await passwordCompare(password, user.password || "");
    if (!isPasswordValid) throw new AppError(401, "Mật khẩu không đúng");

    // Xóa ảnh trên Cloudinary (nếu có)
    if (user.avatarUrl) {
      const publicId = this.extractPublicId(user.avatarUrl);
      if (publicId) await deleteFromCloudinary(publicId);
    }

    await this.userRepository.delete({ idUser: userId });
    return true;
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { idUser: userId } });
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<boolean> {
    const result = await this.userRepository.update({ idUser: userId }, { password: hashedPassword });
    if (result.affected === 0) throw new AppError(404, "Không tìm thấy người dùng");
    return true;
  }

  async deactivateAccount(userId: number, password: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    if (!user) throw new AppError(404, "Không tìm thấy người dùng");

    const isPasswordValid = await passwordCompare(password, user.password || "");
    if (!isPasswordValid) throw new AppError(401, "Mật khẩu không đúng");

    const result = await this.userRepository.update({ idUser: userId }, { status: StatusUser.LOCKED });
    if (result.affected === 0) throw new AppError(404, "Không tìm thấy người dùng");
    return true;
  }

  async reactivateAccount(userId: number): Promise<boolean> {
    const result = await this.userRepository.update({ idUser: userId }, { status: StatusUser.ONLINE });
    if (result.affected === 0) throw new AppError(404, "Không tìm thấy người dùng");
    return true;
  }

  async getAccountStatus(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { idUser: userId },
      select: ["status"],
    });
    if (!user) throw new AppError(404, "Không tìm thấy người dùng");
    return user.status || StatusUser.OFFLINE;
  }

  async findByEmailOrPhone(email?: string, phone?: string): Promise<UserResponse | null> {
    if (!email && !phone) return null;
    const whereClause: any = [];
    if (email) whereClause.push({ email });
    if (phone) whereClause.push({ phone });

    const user = await this.userRepository.findOne({
      where: whereClause,
      select: ["idUser", "name", "email", "phone", "avatarUrl"],
    } as any,
    );
    if (!user) return null;
    return this.mapUserResponse(user as User);
  }

  private extractPublicId(url: string): string | null {
    try {
      if (!url) return null;

      const match = url.match(/\/upload\/(.+)$/);
      if (!match || !match[1]) return null;

      let publicId = match[1]; 
      publicId = publicId.replace(/^v\d+\//, "");

      publicId = publicId.replace(/\.[^/.]+$/, "");

      return publicId; 
    } catch {
      return null;
    }
  }

  }

export default new UserService();
