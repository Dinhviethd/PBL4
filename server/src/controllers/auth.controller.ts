import { Request, Response } from 'express';
import { registerSchema } from '@/schemas/auth.schema'

export const register = async (req:Request, res: Response) => {
  //validate request
  const request= registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });
    //call service
    //return response
}