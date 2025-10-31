import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Message, { IMessage } from "../models/Message";
import Match, { IMatch } from "../models/Match";
import { logger } from "../config/logger";
import { IUser } from "../models/User";
import { Socket } from "socket.io";

interface IMessageWithTemp extends IMessage {
    tempId?: string;
}

interface MessageRequest extends Request {
    user?: IUser;
    io?: Socket;
    onlineUsers?: Map<string, string>;
    body: {
        content: string;
        tempId?: string;
    }
}

/**
 * Retrieves all messages in a match
 * @param {MessageRequest} req - The request object containing the logged in user and the match ID
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to be called
 * @throws {Error} - If the user is not authenticated, or if the match ID is invalid
 * @throws {Error} - If the user does not have access to the match
 * @returns {Promise<void>} - A promise resolving to void
 */
export const getMessages = async (req: MessageRequest, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?._id as mongoose.Types.ObjectId;
        const { matchId } = req.params;

        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(matchId)) {
            return res.status(400).json({ message: "Invalid match ID" });
        }

        const match = await Match.findById(matchId);

        if(!match || !match.users.some((user) => user.equals(currentUserId))) {
            return res.status(403).json({ message: "Forbidden access" });
        }

        const messages = await Message.find({ match: matchId })
        .populate({
            path: "sender",
            select: "username"
        })
        .sort("createdAt");

        await Message.updateMany(
            {
                match: matchId,
                sender: { $ne: currentUserId },
                read: false
            },
            {
                $set: {
                    read: true
                }
            }
        )

        return res.status(200).json(messages);
    } catch (error) {
        logger.error(`Error getting messages: ${error}`);
        next(error);
    }
}

/**
 * Sends a new message in a match
 * @param {MessageRequest} req - The request object containing the logged in user, the match ID, and the message content
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to be called
 * @throws {Error} - If the user is not authenticated, or if the match ID is invalid
 * @throws {Error} - If the user does not have access to the match
 * @throws {Error} - If the message content is invalid
 * @returns {Promise<void>} - A promise resolving to void
 */
export const sendMessage = async (req: MessageRequest, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?._id as mongoose.Types.ObjectId;
        const { matchId } = req.params;
        const { content, tempId } = req.body;

        if(!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if(!mongoose.Types.ObjectId.isValid(matchId)) {
            return res.status(400).json({ message: "Invalid match ID" });
        }

        if (!content || typeof content !== "string" || content.trim() === "") {
            return res.status(400).json({ message: "Invalid message content" });
        }

        const match = await Match.findById(matchId);

        if(!match || !match.users.some((user) => user.equals(currentUserId))) {
            return res.status(403).json({ message: "Forbidden access" });
        }

        const newMessage = await Message.create({
            sender: currentUserId,
            match: matchId,
            content: content.trim(),
            read: false
        });

        match.messages.push(newMessage._id as mongoose.Types.ObjectId);
        await match.save();

        const populatedMessage = (await Message.findById(newMessage._id).populate({
            path: "sender",
            select: "username"
        }))?.toObject() as IMessageWithTemp; // Convert to plain object to add custom properties

        if (tempId) {
            populatedMessage.tempId = tempId;
        }

        logger.info(`Server: Message sent: ${JSON.stringify(populatedMessage)}`);

        // Emit message via Socket.io to all users in the match
        const io = req.io;
        const onlineUsers = req.onlineUsers;

        if(io && onlineUsers) {
            const usersInMatch = match.users;
            for (const user of usersInMatch) {
                const socketId = onlineUsers.get(user.toString());
                if (socketId) {
                    logger.info(`Server: Emitting message to Socket ID: ${socketId} for user: ${user}`);
                    io.to(socketId).emit("newMessage", populatedMessage);
                } else {
                    logger.warn(`Server: No Socket ID found for user: ${user}`);
                }
            }
        } else {
            logger.warn("Server: Socket.io or onlineUsers not found");
        }

        return res.status(201).json(populatedMessage);
    } catch (error) {
        logger.error(`Error sending message: ${error}`);
        next(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

