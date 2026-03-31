import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { createCampaign, campaignList, campaignDetails, changeCampaignStatus } from "../controllers/campaign.controller";

const router = Router();

router.post('/campaigns', authMiddleware, adminMiddleware, createCampaign);
router.get('/campaigns', authMiddleware, adminMiddleware, campaignList);
router.get('/campaigns/:id', authMiddleware, adminMiddleware, campaignDetails);
router.patch('/campaigns/:id/status', authMiddleware, adminMiddleware, changeCampaignStatus);

export default router;