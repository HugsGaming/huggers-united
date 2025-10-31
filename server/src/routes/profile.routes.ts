import { protect } from "../middleware/auth";
import { Router } from "express";
import { createOrUpdateProfile, getProfileByUser, getRandomProfileForUser, likeOrDislikeProfile, getUserMatches, getRandomProfiles, getProfilesLikedByCurrentUser, getProfilesThatLikedCurrentUser } from "../controllers/profileController";
import upload from "../middleware/upload"; 
import { body } from "express-validator";

const router = Router();

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

router.get("/me", protect, getProfileByUser);

router.get("/random", protect, getRandomProfiles);

router.post("/interact", protect, likeOrDislikeProfile);

router.get("/matches", protect, getUserMatches);

router.get('/liked-by-me', protect, getProfilesLikedByCurrentUser); // Profiles the current user has liked
router.get('/liked-me', protect, getProfilesThatLikedCurrentUser);

export default router;

