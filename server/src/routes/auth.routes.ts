import { Router } from "express";
import { body } from "express-validator";
import { registerUser, loginUser, getUserProfile } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

/* 
    @desc    Register a new user
    @route   POST /api/auth/register
    @access  Public
*/
router.post(
    "/register",
    [
        body("username").notEmpty().withMessage("Username is required"),
        body("email").isEmail().withMessage("Invalid email"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    ],
    registerUser
);

/* 
    @desc    Login a user
    @route   POST /api/auth/login
    @access  Public
*/
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Invalid email"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    ],
    loginUser
);

router.get("/me", protect, getUserProfile);

export default router;
