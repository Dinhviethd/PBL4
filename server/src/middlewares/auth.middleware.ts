import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@/utils/error.response";

interface JwtPayload {
  id: number;
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

    console.log("Using JWT_ACCESS_SECRET:", secret); // Debug log
    console.log("Verifying token:", token); // Debug log
    const decoded = jwt.verify(token, secret) as JwtPayload;

  req.user = {
    id: (decoded as any).userId,
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
