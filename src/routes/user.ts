import { Router } from "express";
import { getUserProfile } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get('/profile', authMiddleware, getUserProfile);

export default router;