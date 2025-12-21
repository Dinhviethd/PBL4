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
const errorHandler: ErrorRequestHandler = (err: any, req, res, next) => {
    if (err instanceof ZodError) return handleZodError(res, err);
    
    // Ensure statusCode exists
    const statusCode = err.statusCode === 200 ? err.statusCode : 500;
    const message = err.message || 'Internal Server Error';
    
    return res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
        path: req.path,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}
export default {errorHandler, notFound}