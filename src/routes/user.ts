import { Router } from "express";
import { getUserProfile, getUserSubmissions, getUserPrizeClaims } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/authMiddleware";
import { userMiddleware } from "../middleware/userMiddleware";
import { submitLotteryCode } from "../controllers/submission.controller";
import { submitLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get('/profile', authMiddleware, getUserProfile);
router.post('/lottery/submit', authMiddleware, submitLimiter, userMiddleware, submitLotteryCode);
router.get('/submissions', authMiddleware, userMiddleware, getUserSubmissions);
router.get('/claims', authMiddleware, userMiddleware, getUserPrizeClaims);

export default router;