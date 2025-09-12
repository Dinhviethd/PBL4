import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import {AppError} from '@/utils/error.response'
import { ZodError } from "zod";
const notFound = (req:Request, res: Response, next: NextFunction) => {
    next(new AppError(404, `Cannot find route ${req.method} ${req.originalUrl}` ));
}
const handleZodError = (res: Response, err: ZodError) => {
    const errorArr= err.issues.map((error) => ({
        path: error.path.join("."),
        message: error.message
    }))
    return res.status(400).json({
        success: false,
        errors: errorArr
    })
}
const errorHandler: ErrorRequestHandler = (err: AppError ,req,  res, next) =>{
    if (err instanceof ZodError) return handleZodError(res, err);
    const errorCode= err.statusCode === 200 ? 500 : err.statusCode 
    return res.status(errorCode).json({
        status: errorCode,
        success: false,
        message: err.message,
        path: req.path,
    })
}
export default {errorHandler, notFound}