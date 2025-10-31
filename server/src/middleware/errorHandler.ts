import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

/**
 * Global error handler middleware.
 *
 * Logs the error with the stack trace to the console (if in development mode) and
 * sends a JSON response with the error message and stack trace (if in development mode).
 *
 * @param {any} err - The error object.
 * @param {Request} req - The express request object.
 * @param {Response} res - The express response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error(`Error: ${err.message}`, {
        stack: err.stack,
    });
    
    const status = err.statusCode || 500;
    res.status(status).json({ 
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : null 
    });
}
