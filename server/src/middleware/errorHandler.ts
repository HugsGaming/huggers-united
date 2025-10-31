import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

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
