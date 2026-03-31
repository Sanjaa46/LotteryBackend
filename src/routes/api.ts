import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { getCampaignStatuses, getUserStatuses } from "../controllers/api.controller";

const router = Router();

router.get('/campaign-statuses', authMiddleware, adminMiddleware, getCampaignStatuses);
router.get('/user-statuses', authMiddleware, adminMiddleware, getUserStatuses);

export default router;