import { Router } from "express";
import { protect } from "../middleware/auth";
import { getMessages, sendMessage } from "../controllers/messageController";
import { body } from "express-validator";

const router = Router();

/**
 * @desc    Get all messages for a match
 * @route   GET /api/messages/:matchId
 * @access  Private
 */
router.get("/:matchId", protect, getMessages);

/**
 * @desc    Send a new message in a match
 * @route   POST /api/messages/:matchId
 * @access  Private
 */
router.post("/:matchId", protect, [
    body("content").isString().trim().notEmpty().withMessage("Message content is required"),
], sendMessage);

export default router;
