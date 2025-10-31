import { Router } from "express";
import { protect } from "../middleware/auth";
import { getMessages, sendMessage } from "../controllers/messageController";
import { body } from "express-validator";

const router = Router();

router.get("/:matchId", protect, getMessages);

router.post("/:matchId", protect, [
    body("content").isString().trim().notEmpty().withMessage("Message content is required"),
], sendMessage);

export default router;
