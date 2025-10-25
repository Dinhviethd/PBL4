import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@/utils/error.response";
import { AppDataSource } from "@/configs/database.config";
import { User } from "@/models/users.model";
import { StatusUser } from "@/constants/constants";
import dotenv from "dotenv"
dotenv.config()
interface JwtPayload {
  userId: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Authorization header missing or invalid");
    }

    const token = authHeader.split(" ")[1];
    if (!token) throw new AppError(401, "Token not provided");

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET is not defined in environment");

    const decoded = jwt.verify(token, secret) as JwtPayload;

  req.user = {
    userId: decoded.userId
  };

    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      next(new AppError(401, "Invalid token"));
    } else if (error.name === "TokenExpiredError") {
      next(new AppError(401, "Token expired"));
    } else {
      next(error);
    }
  }
};

// Middleware to check if account is not locked (for sensitive operations)
export const checkAccountStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
  if (!userId) throw new AppError(401, "Unauthorized");

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { idUser: userId },
      select: ['status']
    });

    if (!user) throw new AppError(404, "User not found");
    
    if (user.status === StatusUser.LOCKED) {
      throw new AppError(403, "Tài khoản đã bị vô hiệu hóa. Vui lòng đăng nhập lại để kích hoạt.");
    }

    next();
  } catch (error: any) {
    next(error);
  }
};
