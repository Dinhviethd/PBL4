import { Request, Response } from "express";
import userService from "@/services/user.service";
import { updateUserSchema } from "@/schemas/user.schema";
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

    const updatedUser = await userService.updateAvatar(userId, req.file.filename);
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
    
    if (!currentPassword || !newPassword) {
      throw new AppError(400, "Thiếu thông tin mật khẩu");
    }
    
    if (newPassword.length < 6) {
      throw new AppError(400, "Mật khẩu mới phải có ít nhất 6 ký tự");
    }
    
    // Lấy thông tin user hiện tại để kiểm tra mật khẩu
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new AppError(404, "Không tìm thấy người dùng");
    }
    
    if (!user.password) {
      throw new AppError(400, "Tài khoản không có mật khẩu");
    }
    
    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await passwordCompare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError(400, "Mật khẩu hiện tại không đúng");
    }
    
    // Kiểm tra mật khẩu mới không được giống mật khẩu cũ
    const isSamePassword = await passwordCompare(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError(400, "Mật khẩu mới không được giống mật khẩu hiện tại");
    }
    
    // Hash mật khẩu mới và cập nhật
    const hashedNewPassword = await hashPassword(newPassword);
    await userService.updatePassword(userId, hashedNewPassword);
    
    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error: any) {
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
