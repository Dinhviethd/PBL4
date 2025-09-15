import { Request, Response } from "express";
import userService from "@/services/user.service";
import { updateUserSchema } from "@/schemas/user.schema";
import { AppError } from "@/utils/error.response";

export const getMyInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, "Unauthorized");
    const user = await userService.getMyInfo(userId);
    res.json({ success: true, data: user });
  } catch (error: any) {
    throw error;
  }
};
export const updateMyInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
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

export const deleteMyAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, "Unauthorized");
    await userService.deleteMyAccount(userId);
    res.json({ success: true, message: "User deleted" });
  } catch (error: any) {
    throw error;
  }
};
