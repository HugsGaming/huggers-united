import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { logger } from "../config/logger";
import User, { IUser } from "../models/User";
import mongoose from "mongoose";

export interface CustomRequest extends Request {
    user?: IUser
}

export const protect = async (req: CustomRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, config.jwtSecret as string) as { userId: mongoose.Types.ObjectId };

            req.user = await User.findById(decoded.userId).select("-passwordHash");

            if(!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            next();
        } catch (error) {
            logger.error(`Error verifying token: ${error}`);
            return res.status(401).json({ message: "Unauthorized" });
        }
    }

    if (!token) {
        logger.error("No token found");
        return res.status(401).json({ message: "Unauthorized" });
    }
}
