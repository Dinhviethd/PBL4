

import { User } from "@/models/users.model";
import { Repository, Not } from "typeorm";
import { AppDataSource } from "@/configs/database.config";
import { AppError } from "@/utils/error.response";
import { UpdateUserDTO, UserResponse } from "@/DTOs/user.dto";
import { uploadToCloudinary, deleteFromCloudinary } from "@/utils/upload"
import { StatusUser, verifiedCodeType } from "@/constants/constants";
import { passwordCompare, hashPassword } from "@/utils/password";
import { VerifiedCode } from "@/models/verification.model";
import dayjs from "dayjs";
import notificationService from '@/services/notification.service';

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

  async getUserById(userId: number): Promise<UserResponse | null> {
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    if (!user) return null;
    return this.mapUserResponse(user);
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

  async requestPasswordChange(userId: number, currentPassword: string, newPassword: string): Promise<{ verificationId: number; message: string }> {
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    if (!user) throw new AppError(404, "Không tìm thấy người dùng");

    if (!user.password) {
      throw new AppError(400, "Tài khoản không có mật khẩu");
    }

    console.log(`Debug: Password change request for user ${userId}`);
    console.log(`Debug: Current password provided: ${currentPassword ? 'YES' : 'NO'}`);
    console.log(`Debug: New password provided: ${newPassword ? 'YES' : 'NO'}`);
    console.log(`Debug: User has password in DB: ${user.password ? 'YES' : 'NO'}`);
    console.log(`Debug: DB password starts with $2: ${user.password?.startsWith('$2') ? 'YES' : 'NO'}`);
    console.log(`Debug: DB password length: ${user.password?.length}`);

    // Verify current password
    const isCurrentPasswordValid = await passwordCompare(currentPassword, user.password);
    console.log(`Debug: Current password validation result: ${isCurrentPasswordValid}`);
    
    if (!isCurrentPasswordValid) {
      console.log(`Debug: Current password validation failed for user ${userId}`);
      throw new AppError(400, "Mật khẩu hiện tại không đúng");
    }

    // Check if new password is the same as current
    const isSamePassword = await passwordCompare(newPassword, user.password);
    console.log(`Debug: Same password check result: ${isSamePassword}`);
    
    if (isSamePassword) {
      console.log(`Debug: New password is same as current for user ${userId}`);
      throw new AppError(400, "Mật khẩu mới không được giống mật khẩu hiện tại");
    }

    // Hash the new password to store temporarily
    const hashedNewPassword = await hashPassword(newPassword);
    console.log(`Debug: New password hashed successfully`);

    // Create verification record
    const verificationCodeRepository = AppDataSource.getRepository(VerifiedCode);
    const verification = await verificationCodeRepository.save({
      ExpiredAt: dayjs().add(24, 'hour').toDate(),
      type: verifiedCodeType.PasswordVerification,
      code: hashedNewPassword,
      user
    });

    console.log(`Debug: Verification record created with ID: ${verification.idVerifiedCode}`);

    return {
      verificationId: verification.idVerifiedCode,
      message: "Verification email has been sent"
    };
  }

  // Method để test password validation
  async testPasswordValidation(userId: number, testPassword: string): Promise<{ isValid: boolean; userHasPassword: boolean; passwordFormat: string }> {
    const user = await this.userRepository.findOne({ where: { idUser: userId } });
    if (!user) throw new AppError(404, "Không tìm thấy người dùng");

    if (!user.password) {
      return {
        isValid: false,
        userHasPassword: false,
        passwordFormat: 'NO_PASSWORD'
      };
    }

    const isValid = await passwordCompare(testPassword, user.password);
    return {
      isValid,
      userHasPassword: true,
      passwordFormat: user.password.startsWith('$2') ? 'BCRYPT' : 'UNKNOWN'
    };
  }

  async confirmPasswordChange(userId: number, verificationId: number, userEmail: string): Promise<boolean> {
    const verificationCodeRepository = AppDataSource.getRepository(VerifiedCode);
    const verification = await verificationCodeRepository.findOne({
      where: {
        idVerifiedCode: verificationId,
        type: verifiedCodeType.PasswordVerification
      },
      relations: ['user']
    });

    if (!verification || verification.ExpiredAt < new Date()) {
      throw new AppError(400, "Invalid or expired verification link");
    }

    if (verification.user.email !== userEmail) {
      throw new AppError(400, "Invalid verification link");
    }

    if (!verification.code) {
      throw new AppError(400, "Invalid verification data");
    }

    // Update password with the stored hashed password
    const result = await this.userRepository.update({ idUser: userId }, { password: verification.code });
    if (result.affected === 0) throw new AppError(404, "Không tìm thấy người dùng");

    // Clean up verification record
    await verificationCodeRepository.delete(verificationId);

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
    if (email) whereClause.push({ email, status: StatusUser.LOCKED });
    if (phone) whereClause.push({ phone, status: StatusUser.LOCKED });

    // Only find users whose status is not LOCKED
    const user = await this.userRepository.findOne({
      where: whereClause.length > 0 ? whereClause.map((cond: any) => ({ ...cond, status: Not(StatusUser.LOCKED) })) : undefined,
      select: ["idUser", "name", "email", "phone", "avatarUrl", "gender", "birthday"],
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
