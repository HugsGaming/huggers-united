import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { logger } from "../config/logger";
import mongoose from "mongoose";

export const generateToken = (userId: mongoose.Types.ObjectId): string => {
    try {
        const token = jwt.sign({ userId }, config.jwtSecret, {
            expiresIn: "1d",
        });
        logger.debug(`Generated token for user ${userId}: ${token}`);
        return token;
    } catch (error) {
        logger.error(`Error generating token for user ${userId}: ${error}`);
        throw new Error("Failed to generate token");
    }
}
