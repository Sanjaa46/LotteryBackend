import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { getCampaignStatuses, getUserStatuses, getClaimStatuses } from "../controllers/api.controller.js";

const router = Router();

router.get('/campaign-statuses', authMiddleware, adminMiddleware, getCampaignStatuses);
router.get('/user-statuses', authMiddleware, adminMiddleware, getUserStatuses);
router.get('/claim-statuses', authMiddleware, adminMiddleware, getClaimStatuses);

export default router;