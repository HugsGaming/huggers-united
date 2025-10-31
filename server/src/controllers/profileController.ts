import { Request, Response, NextFunction } from "express";
import { UploadApiResponse } from "cloudinary";
import Profile, { IProfile } from "../models/Profile";
import { IUser } from "../models/User";
import { logger } from "../config/logger";
import cloudinary from "../config/cloudinary";
import mongoose from "mongoose";
import Like from "../models/Like";
import Match from "../models/Match";

interface ProfileRequest extends Request {
    user?: IUser;
    file?: Express.Multer.File;
}

/**
 * Creates or updates a user's profile
 * @param {ProfileRequest} req - The request object with the logged in user and the profile information
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to be called
 * @returns {Promise<void>} - A promise resolving to void
 * @throws {Error} - If there is an error creating or updating the profile
 */
export const createOrUpdateProfile = async (
    req: ProfileRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, bio, gender, interests, dateOfBirth } = req.body;
        const userId = req.user?._id as mongoose.Types.ObjectId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        let profilePictureUrl = "";

        // Handle profile Picture Upload if a file is provided
        if (req.file) {
            try {
                const result: UploadApiResponse = await cloudinary.uploader.upload(
                    `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
                    {
                        folder: "dating-app/profile-pictures",
                        width: 200,
                        height: 200,
                        crop: "fill",
                    }
                );

                profilePictureUrl = result.secure_url;
            } catch (error) {
                logger.error(`Error uploading profile picture: ${error}`);
                return res.status(500).json({ message: "Error uploading profile picture" });
            }
        }

        const profileFields: Partial<IProfile> = {
            user: userId,
            name,
            bio,
            gender,
            interests: interests ? (Array.isArray(interests) ? interests : interests.split(",")) : [],
            dateOfBirth
        };

        if (profilePictureUrl) {
            profileFields.profilePicture = profilePictureUrl;
        }

        let profile = await Profile.findOne({ user: userId });

        if (profile) {
            if (!profilePictureUrl && !req.body.profilePicture) {
                delete profileFields.profilePicture;
            }

            profile = await Profile.findByIdAndUpdate(profile._id, { $set: profileFields }, { new: true, runValidators: true });
            return res.status(200).json(profile);
        } else {
            // Create a new profile
            if (!profilePictureUrl) {
                profileFields.profilePicture = profileFields.profilePicture || "";
            }

            profile = new Profile(profileFields);
            await profile.save();
            return res.status(201).json(profile)
        }
    } catch (error: any) {
        logger.error(`Error creating or updating profile: ${error}`);
        next(error);
    }
    
}

/**
 * Returns a random profile for the current user that has not been liked or disliked by the current user
 * @param {ProfileRequest} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to be called
 * @returns {Promise<void>} - A promise resolving to void
 */
export const getRandomProfileForUser = async (req: ProfileRequest, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?._id as mongoose.Types.ObjectId;

        if(!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const likedOrDislikedUsers = await Like.find({
            liker: currentUserId,
        }).distinct("liked");

        const excludedUserIds = [...likedOrDislikedUsers, currentUserId];

        const randomProfile = await Profile.aggregate([
            {
                // Select a random profile that has not been liked or disliked by the current user
                $match: {
                    user: { $nin: excludedUserIds },
                }
            },
            // Select a random profile
            { $sample: { size: 1 } },
            // Lookup the user details
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                }
            },
            // Unwind the user details
            {
                $unwind: "$userDetails",
            },
            // Project the required fields
            {
                $project: {
                    _id: 1,
                    user: 1,
                    name: 1,
                    bio: 1,
                    profilePicture: 1,
                    gender: 1,
                    interests: 1,
                    dateOfBirth: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    username: "$userDetails.username",
                    email: "$userDetails.email",
                }
            }
        ]);

        if (randomProfile.length === 0) {
            return res.status(404).json({ message: "No random profile found. Please try again later." });
        }

        return res.status(200).json(randomProfile[0]);
    } catch (error: any) {
        logger.error(`Error getting random profile: ${error}`);
        next(error);
    }
}

/**
 * Likes or dislikes a profile
 * @param {ProfileRequest} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to be called
 * @returns {Promise<void>} - A promise resolving to void
 * @throws {Error} - If the user is not authenticated, or if the request is invalid
 * @throws {Error} - If the user has already interacted with the profile
 * @throws {Error} - If the user tries to like or dislike themselves
 */
export const likeOrDislikeProfile = async (req: ProfileRequest, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?._id as mongoose.Types.ObjectId;
        const { likedUserId, action } = req.body; // action can be "liked" or "disliked"

        if(!currentUserId) {
            logger.error("User ID not found");
            return res.status(401).json({ message: "Unauthorized" });
        }

        if(!likedUserId || !action || !["liked", "disliked"].includes(action)) {
            logger.error("Invalid request. 'likedUserId' and 'action' are required.");
            return res.status(400).json({ message: "Invalid request. 'likedUserId' and 'action' are required." });
        }

        if (currentUserId.toString() === likedUserId) {
            logger.error("You cannot like or dislike yourself.");
            return res.status(400).json({ message: "You cannot like or dislike yourself." });
        }

        const existingInteraction = await Like.findOne({
            liker: currentUserId,
            liked: likedUserId,
        });

        // Check if the user has already interacted with the profile
        if (existingInteraction) {
            logger.error("You have already interacted with this profile.");
            return res.status(409).json({ message: "You have already interacted with this profile." });
        }

        // Create a new interaction
        const newLike = await Like.create({
            liker: currentUserId,
            liked: likedUserId,
            status: action,
        });

        if (action === "disliked") {
            logger.debug(`User ${currentUserId} disliked user ${likedUserId}`);
            // If its a dislike, record it and return. Sad No Match :<
            return res.status(200).json({ message: "Profile disliked successfully.", like: newLike });
        }

        const mutualLike = await Like.findOne({
            liker: likedUserId,
            liked: currentUserId,
            status: "liked",
        });

        if(mutualLike) {
            // If its a like, its a match. Match! :>
            const usersInMatch = [currentUserId, likedUserId];
            usersInMatch.sort((a, b) => a.toString().localeCompare(b.toString()));

            let match = await Match.findOne({
                users: usersInMatch,
            });

            if (!match) {
                // If no match found, create a new match
                match = await Match.create({
                    users: usersInMatch,
                });

                // Emit Socket.io event for both users
                const io = req.io;
                const onlineUsers = req.onlineUsers;

                if(io && onlineUsers) {
                    const currentProfile = await Profile.findOne({ user: currentUserId });
                    const likedUserProfile = await Profile.findOne({ user: likedUserId });

                    const currentUsername = currentProfile?.name || "A user";
                    const likedUsername = likedUserProfile?.name || "A user";

                    // Notify the 'liker' (current user)
                    const likerSocketId = onlineUsers.get(currentUserId.toString());
                    if (likerSocketId) {
                        io.to(likerSocketId).emit("newMatch", {
                            matchId: match._id,
                            otherUser: {
                                _id: likedUserId,
                                username: likedUsername,
                                profilePicture: likedUserProfile?.profilePicture,
                            },
                            message: `You have a new match with ${likedUsername}!`,
                        });
                        logger.debug(`Sent 'newMatch' event to user ${currentUserId}`);
                    }

                    const likedUserSocketId = onlineUsers.get(likedUserId.toString());
                    if (likedUserSocketId) {
                        io.to(likedUserSocketId).emit("newMatch", {
                            matchId: match._id,
                            otherUser: {
                                _id: currentUserId,
                                username: currentUsername,
                                profilePicture: currentProfile?.profilePicture,
                            },
                            message: `You have a new match with ${currentUsername}!`,
                        });
                        logger.debug(`Sent 'newMatch' event to user ${likedUserId}`);
                    }
                }
                return res.status(201).json({ message: "Match created successfully.", match, like: newLike });
            } else {
                // If match found (due to Race Condition), return
                return res.status(200).json({ message: "Match already exists.", match, like: newLike });
            }
        } else {
            // If its a like, return
            return res.status(200).json({ message: "Profile liked successfully.", like: newLike });
        }

    } catch (error: any) {
        logger.error(`Error liking or disliking profile: ${error}`);
        if (error.code === 11000) {
            logger.error("You have already interacted with this profile.");
            return res.status(409).json({ message: "You have already interacted with this profile." });
        }
        next(error);
    }
}

export const getProfilesLikedByCurrentUser = async (req: ProfileRequest, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?._id as mongoose.Types.ObjectId;

        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const likedInteractions = await Like.find({
            liker: currentUserId,
            status: "liked",
        });

        const likedUserIds = likedInteractions.map((interaction) => interaction.liked);

        if (likedUserIds.length === 0) {
            return res.status(200).json([]);
        }

        // Fetch the profiles of the user who were liked
        const likedProfiles = await Profile.aggregate([
            {
                $match: {
                    user: { $in: likedUserIds },
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    name: 1,
                    bio: 1,
                    profilePicture: 1,
                    gender: 1,
                    interests: 1,
                    dateOfBirth: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    username: "$userDetails.username",
                    email: "$userDetails.email"
                }
            }
        ]);
        logger.debug(`Fetched ${likedProfiles.length} profiles liked by user ${currentUserId}`);
        return res.status(200).json(likedProfiles);
    } catch (error: any) {
        
    }
}

/**
 * Retrieves all profiles of users who liked the current user
 * @param {ProfileRequest} req - The request object with the logged in user
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to be called
 * @throws {Error} - If the user is not authenticated
 * @returns {Promise<void>} - A promise resolving to void
 */
export const getProfilesThatLikedCurrentUser = async (req: ProfileRequest, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?._id as mongoose.Types.ObjectId;

        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Find all users who liked the current user
        const userWhoLikedMe = await Like.find({
            liked: currentUserId,
            status: "liked",
        });

        const likerUserIds = userWhoLikedMe.map((interaction) => interaction.liker);

        if (likerUserIds.length === 0) {
            return res.status(200).json([]);
        }

        // Filter out users that the current user has already interacted with (liked or disliked)
        // Prevents showing someone in "Liked Me" if they have already interacted with the current user
        const alreadyInteractedWith = await Like.find({
            liker: currentUserId,
            liked: { $in: likerUserIds },
        }).distinct("liked");

        const filteredLikerUserIds = likerUserIds.filter(
            (userId) => !alreadyInteractedWith.some(
                (interactedId) => interactedId.equals(userId)
            )
        );

        if (filteredLikerUserIds.length === 0) {
            return res.status(200).json([]);
        }

        // Fetch the profiles of the users who liked the current user
        const likerProfiles = await Profile.aggregate([
            {
                $match: {
                    user: { $in: filteredLikerUserIds },
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    name: 1,
                    bio: 1,
                    profilePicture: 1,
                    gender: 1,
                    interests: 1,
                    dateOfBirth: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    username: "$userDetails.username",
                    email: "$userDetails.email"
                }
            }
        ]);
        logger.debug(`Fetched ${likerProfiles.length} profiles that liked user ${currentUserId}`);
        return res.status(200).json(likerProfiles);
    } catch (error) {
        logger.error(`Error getting profiles that liked current user: ${error}`);
        next(error);
    }
}


/**
 * Retrieves all matches for the current user
 * @param {ProfileRequest} req - The request object with the logged in user
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next function to be called
 * @throws {Error} - If the user is not authenticated
 * @returns {Promise<void>} - A promise resolving to void
 */
export const getUserMatches = async (req: ProfileRequest, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?._id as mongoose.Types.ObjectId;

        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const matches = await Match.find({
            users: currentUserId,
        }).populate({
            path: "users",
            select: "username email"
        }).populate({
            path: "messages",
            options: { sort: { createdAt: 1 } },
        })
        .lean();

        const formattedMatches = await Promise.all(
            matches.map(async (match) => {
                const otherUser = match.users.find((user: any) => !user._id.equals(currentUserId));
                const otherUserProfile = otherUser ? await Profile.findOne({ user: otherUser._id }) : null;

                return {
                    matchId: match._id,
                    otherUser: {
                        _id: otherUser?._id,
                        username: (otherUser as any).username,
                        email: (otherUser as any).email,
                        profile: otherUserProfile
                    },
                    lastMessage: match.messages.length > 0 ? match.messages[match.messages.length - 1] : null,
                    createdAt: match.createdAt,
                    updatedAt: match.updatedAt
                };
            })
        );

        return res.status(200).json(formattedMatches);

    } catch (error) {
        logger.error(`Error getting user matches: ${error}`);
        next(error);
    }
}


export const getRandomProfiles = async (req: ProfileRequest, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?._id as mongoose.Types.ObjectId;

        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const likedOrDislikedUsers = await Like.find({
            liker: currentUserId,
        }).distinct("liked");

        const excludedUserIds = [...likedOrDislikedUsers, currentUserId];

        const randomProfiles = await Profile.aggregate([
            {
                // Select profiles that have not been liked or disliked by the current user
                $match: {
                    user: { $nin: excludedUserIds },
                }
            },
            // Select 10 random profiles
            { $sample: { size: 10 } }, // Changed from 1 to 10
            // Lookup the user details
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                }
            },
            // Unwind the user details
            {
                $unwind: "$userDetails",
            },
            // Project the required fields
            {
                $project: {
                    _id: 1,
                    user: 1,
                    name: 1,
                    bio: 1,
                    profilePicture: 1,
                    gender: 1,
                    interests: 1,
                    dateOfBirth: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    username: "$userDetails.username",
                    email: "$userDetails.email",
                }
            }
        ]);

        if (randomProfiles.length === 0) {
            logger.warn("No more profiles found. Check back later!");
            return res.status(404).json({ message: "No more profiles found. Check back later!" });
        }
        logger.debug(`Fetched ${randomProfiles.length} random profiles`);
        return res.status(200).json(randomProfiles); // Now returns an array of profiles
    } catch (error: any) {
        logger.error(`Error getting random profiles: ${error}`);
        next(error);
    }
}

export const getProfileByUser = async (req: ProfileRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id as mongoose.Types.ObjectId;
        
        if (!userId) {
            logger.error("User ID not found");
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Get Profile with username
        const profiles = await Profile.aggregate([
            {
                $match: {
                    user: userId
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    name: 1,
                    bio: 1,
                    profilePicture: 1,
                    gender: 1,
                    interests: 1,
                    dateOfBirth: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    username: "$userDetails.username",
                    email: "$userDetails.email"
                }
            }
        ]);

        const profile = profiles[0];

        if (!profile) {
            logger.warn(`Profile not found for user ${userId}`);
            return res.status(404).json({ message: "Profile not found" });
        }

        logger.debug(`Fetched profile for user ${userId}`);
        return res.status(200).json(profile);
    } catch (error: any) {
        logger.error(`Error getting profile by user: ${error}`);
        next(error);
    }
}
