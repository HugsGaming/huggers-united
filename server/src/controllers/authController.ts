import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import { logger } from "../config/logger";
import { CustomRequest } from "../middleware/auth";
import mongoose from "mongoose";

/**
 * Registers a new user
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to be called
 * @returns {Promise<void>} - A promise resolving to void
 */
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn(`Validation errors: ${JSON.stringify(errors.array())}`);
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        user = await User.create({ username, email, passwordHash: password });

        const token = generateToken(user._id as mongoose.Types.ObjectId);
        logger.info(`User ${user.username} registered successfully with email ${user.email}`);

        return res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token
        });
    } catch (error) {
        logger.error(`Error registering user: ${error}`);
        next(error);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * Logs in a user
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to be called
 * @returns {Promise<void>} - A promise resolving to void
 */
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn(`Validation errors: ${JSON.stringify(errors.array())}`);
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            const token = generateToken(user._id as mongoose.Types.ObjectId);
            logger.info(`User ${user.username} logged in successfully with email ${user.email}`);

            return res.status(200).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token
            });
        } else {
            logger.info(`Invalid credentials for email ${email}`);
            return res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error: any) {
        logger.error(`Error logging in user: ${error}`);
        next(error);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * Fetches the user profile for the currently logged in user
 * @param {CustomRequest} req - The request object with the logged in user
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to be called
 * @returns {Promise<void>} - A promise resolving to void
 */
export const getUserProfile = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    
    try {
        const user = await User.findById(req.user?._id).select("-passwordHash");

        if (user) {
            logger.debug(`Fetched user profile for user ${user.username}`);
            return res.status(200).json({
                _id: user._id,
                username: user.username,
                email: user.email
            });
        } else {
            logger.warn(`User profile not found for user ${req.user?.username}`);
            return res.status(404).json({ message: "User profile not found" });
        }
    } catch (error: any) {
        logger.error(`Error fetching user profile: ${error}`);
        next(error);
        return res.status(500).json({ message: "Server error" });
    }
}

