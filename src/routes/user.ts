import { Router } from "express";
import { getUserProfile } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/authMiddleware";
import { userMiddleware } from "../middleware/userMiddleware";
import { submitLotteryCode } from "../controllers/submission.controller";

const router = Router();

router.get('/profile', authMiddleware, getUserProfile);
router.post('/lottery/submit', authMiddleware, userMiddleware, submitLotteryCode);

export default router;