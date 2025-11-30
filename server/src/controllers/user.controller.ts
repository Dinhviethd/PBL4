
import { Request, Response } from "express";
import userService from "@/services/user.service";
import emailService from "@/services/email.service";
import { updateUserSchema, confirmPasswordChangeSchema } from "@/schemas/user.schema";
import { AppError } from "@/utils/error.response";
import { hashPassword, passwordCompare } from "@/utils/password";

export const getMyInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    const user = await userService.getMyInfo(userId);
    res.json({ success: true, data: user });
  } catch (error: any) {
    throw error;
  }
};
export const updateMyInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    const validatedData = updateUserSchema.parse(req.body);
    const updatedUser = await userService.updateMyInfo(userId, validatedData);
    res.json({ success: true, data: updatedUser });
  } catch (error: any) {
    if (error.name === "ZodError") {
      throw new AppError(400, "Validation failed");
    }
    throw error;
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    
    if (!req.file) {
      throw new AppError(400, "Không có file ảnh nào được tải lên");
    }

    const updatedUser = await userService.updateAvatar(userId, req.file.path, "avatars");
    res.json({ success: true, data: updatedUser, message: "Cập nhật avatar thành công" });
  } catch (error: any) {
    throw error;
  }
};

export const deleteMyAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    
    const { confirmText, password } = req.body;
    if (confirmText !== "XÓA TÀI KHOẢN") {
      throw new AppError(400, "Xác nhận không đúng");
    }
    
    if (!password) {
      throw new AppError(400, "Mật khẩu là bắt buộc");
    }
    
    await userService.deleteMyAccount(userId, password);
    res.json({ success: true, message: "Tài khoản đã được xóa thành công" });
  } catch (error: any) {
    throw error;
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    
    const { currentPassword, newPassword } = req.body;
    
    console.log(`Debug Controller: Change password request for user ${userId}`);
    console.log(`Debug Controller: Current password provided: ${currentPassword ? 'YES' : 'NO'}`);
    console.log(`Debug Controller: New password provided: ${newPassword ? 'YES' : 'NO'}`);
    
    if (!currentPassword || !newPassword) {
      throw new AppError(400, "Thiếu thông tin mật khẩu");
    }
    
    if (newPassword.length < 6) {
      throw new AppError(400, "Mật khẩu mới phải có ít nhất 6 ký tự");
    }
    
    // Request password change verification
    const result = await userService.requestPasswordChange(userId, currentPassword, newPassword);
    
    // Get user email to send verification email
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new AppError(404, "Không tìm thấy người dùng");
    }

    // Create confirmation link với redirect route
    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const confirmationLink = `${baseUrl}/password-change-redirect?token=${result.verificationId}&email=${encodeURIComponent(user.email || '')}`;
    
    try {
      // Send email using email service
      await emailService.sendPasswordResetConfirmationEmail(user.email || '', confirmationLink);
    } catch (error) {
      // If email fails, still log the link for development
      console.log(`Password change confirmation email for ${user.email}:`);
      console.log(`Click this link to confirm your password change: ${confirmationLink}`);
      console.log(`Verification ID: ${result.verificationId}`);
      console.error('Failed to send email, but link is logged above');
    }
    
    res.json({ 
      success: true, 
      message: "Email xác nhận đã được gửi! Vui lòng kiểm tra email của bạn để xác nhận thay đổi mật khẩu.",
      verificationId: result.verificationId
    });
  } catch (error: any) {
    console.error('Debug Controller: Error in changePassword:', error);
    throw error;
  }
};

export const deactivateAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    
    const { password } = req.body;
    if (!password) throw new AppError(400, "Mật khẩu là bắt buộc");
    
    await userService.deactivateAccount(userId, password);
    res.json({ success: true, message: "Tài khoản đã được vô hiệu hóa" });
  } catch (error: any) {
    throw error;
  }
};

export const reactivateAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    
    await userService.reactivateAccount(userId);
    res.json({ success: true, message: "Tài khoản đã được kích hoạt lại" });
  } catch (error: any) {
    throw error;
  }
};

export const confirmPasswordChange = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    
    const validatedData = confirmPasswordChangeSchema.parse(req.body);

    await userService.confirmPasswordChange(userId, validatedData.verificationId, validatedData.email);
    
    res.json({ 
      success: true, 
      message: "Mật khẩu đã được thay đổi thành công!" 
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw new AppError(400, 'Validation failed');
    }
    throw error;
  }
};

// Debug endpoint - remove in production
export const testPasswordValidation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    
    const { testPassword } = req.body;
    if (!testPassword) {
      throw new AppError(400, "Test password is required");
    }
    
    const result = await userService.testPasswordValidation(userId, testPassword);
    res.json({ success: true, data: result });
  } catch (error: any) {
    throw error;
  }
};

export const getAccountStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    
    const status = await userService.getAccountStatus(userId);
    res.json({ success: true, status });
  } catch (error: any) {
    throw error;
  }
};

export const lookupUser = async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.query as any;
    const currentUserId = req.user?.userId;
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Provide email or phone' });
    }
    const user = await userService.findByEmailOrPhone(email, phone);
    if (!user) return res.json({ success: true, data: null });

    // Nếu đang đăng nhập, kiểm tra trạng thái block
    if (currentUserId) {
      const FriendshipRepository = require("@/repositories/friendship.repository").FriendshipRepository;
      const friendRepo = new FriendshipRepository();
      const relation = await friendRepo.findFriendship(currentUserId, user.idUser);
      if (relation && relation.status === "blocked") {
        return res.json({ success: true, data: null });
      }
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    throw error;
  }
};
// Lấy thông tin user theo id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (!userId) throw new AppError(400, "Thiếu id user");
    const user = await userService.getUserById(Number(userId));
    if (!user) throw new AppError(404, "Không tìm thấy user");
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};