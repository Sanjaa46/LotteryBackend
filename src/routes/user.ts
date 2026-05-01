import { Router } from "express";
import { getUserProfile, getUserSubmissions, getUserPrizeClaims } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { userMiddleware } from "../middleware/userMiddleware.js";
import { submitLotteryCode } from "../controllers/submission.controller.js";
import { submitLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get('/profile', authMiddleware, getUserProfile);
router.post('/lottery/submit', authMiddleware, submitLimiter, userMiddleware, submitLotteryCode);
router.get('/submissions', authMiddleware, userMiddleware, getUserSubmissions);
router.get('/claims', authMiddleware, userMiddleware, getUserPrizeClaims);

export default router;