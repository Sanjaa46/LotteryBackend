import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getCampaignStatuses, getUserStatuses } from "../controllers/api.controller";

const router = Router();

router.get('/campaign-statuses', authMiddleware, getCampaignStatuses);
router.get('/user-statuses', authMiddleware, getUserStatuses);

export default router;