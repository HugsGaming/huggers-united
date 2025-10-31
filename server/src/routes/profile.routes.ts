import { protect } from "../middleware/auth";
import { Router } from "express";
import { createOrUpdateProfile, getProfileByUser, getRandomProfileForUser, likeOrDislikeProfile, getUserMatches, getRandomProfiles, getProfilesLikedByCurrentUser, getProfilesThatLikedCurrentUser } from "../controllers/profileController";
import upload from "../middleware/upload"; 
import { body } from "express-validator";

const router = Router();

/* 
    @desc    Create or update a user's profile
    @route   POST /api/profile
    @access  Private
*/
router.route("/").post(protect,
    [
    body("name").isLength({ min: 3 }).withMessage("Name must be at least 3 characters long"),
    body("bio").isLength({ min: 3 }).withMessage("Bio must be at least 3 characters long"),
    body("gender").isLength({ min: 3 }).withMessage("Gender must be at least 3 characters long"),
    body("interests").isArray().withMessage("Interests must be an array"),
    body("dateOfBirth").isDate().withMessage("Date of birth must be a valid date"),
    ],
    upload.single("profilePicture"), 
    createOrUpdateProfile);

/* 
    @desc    Get a random profile for a user
    @route   GET /api/profile/random
    @access  Private
*/
router.get("/random", protect, getRandomProfileForUser);

/* 
    @desc    Get a user's profile
    @route   GET /api/profile/me
    @access  Private
*/
router.get("/me", protect, getProfileByUser);

/*
    @desc    Get random profiles for a user
    @route   GET /api/profile/random
    @access  Private
*/
router.get("/random", protect, getRandomProfiles);

/*
    @desc    Like or dislike a profile
    @route   POST /api/profile/interact
    @access  Private
*/
router.post("/interact", protect, likeOrDislikeProfile);

/*
    @desc    Get all matches for a user
    @route   GET /api/profile/matches
    @access  Private
*/
router.get("/matches", protect, getUserMatches);

/*
    @desc    Get all profiles that a user has liked
    @route   GET /api/profile/liked-by-me
    @access  Private
*/
router.get('/liked-by-me', protect, getProfilesLikedByCurrentUser); 

/*
    @desc    Get all profiles that have liked a user
    @route   GET /api/profile/liked-me
    @access  Private
*/
router.get('/liked-me', protect, getProfilesThatLikedCurrentUser);

export default router;

