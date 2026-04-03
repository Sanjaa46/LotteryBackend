import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { createCampaign, campaignList, campaignDetails, activateCampaign } from "../controllers/campaign.controller";
import { createPrize, prizeList, editPrize } from "../controllers/prize.controller";
import { createCodeBatch, getCodeBatchDetails, codeBatchList, exportCodeBatch } from "../controllers/lotteryCode.controller";

const router = Router();

router.post('/campaigns', authMiddleware, adminMiddleware, createCampaign);
router.get('/campaigns', authMiddleware, adminMiddleware, campaignList);
router.get('/campaigns/:id', authMiddleware, adminMiddleware, campaignDetails);
router.patch('/campaigns/:id/activate', authMiddleware, adminMiddleware, activateCampaign);

router.post('/campaigns/:id/prizes', authMiddleware, adminMiddleware, createPrize);
router.get('/campaigns/:id/prizes', authMiddleware, adminMiddleware, prizeList);

router.patch('/prizes/:id', authMiddleware, adminMiddleware, editPrize);

router.post('/campaigns/:id/codes/generate', authMiddleware, adminMiddleware, createCodeBatch);
router.get('/campaigns/:id/batches', authMiddleware, adminMiddleware, codeBatchList);
router.get('/batches/:id', authMiddleware, adminMiddleware, getCodeBatchDetails);
router.get('/batches/:id/export', authMiddleware, adminMiddleware, exportCodeBatch);

export default router;