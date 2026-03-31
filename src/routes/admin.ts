import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { createCampaign, campaignList, campaignDetails, changeCampaignStatus } from "../controllers/campaign.controller";

const router = Router();

router.post('/campaigns', authMiddleware, createCampaign);
router.get('/campaigns', authMiddleware, campaignList);
router.get('/campaigns/:id', authMiddleware, campaignDetails);
router.patch('/campaigns/:id/status', authMiddleware, changeCampaignStatus);

export default router;