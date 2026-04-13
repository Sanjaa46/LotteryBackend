import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { createCampaign, campaignList, campaignDetails, activateCampaign, pauseCampaign, unpauseCampaign } from "../controllers/campaign.controller";
import { createPrize, prizeList, editPrize } from "../controllers/prize.controller";
import { createCodeBatch, getCodeBatchDetails, codeBatchList, exportCodeBatch } from "../controllers/lotteryCode.controller";
import { getPrizeClaims, changeClaimStatus } from "../controllers/claim.controller";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { getSubmissionReport, getWinnersReport } from "../controllers/report.controller";

const router = Router();

router.post('/campaigns', authMiddleware, adminMiddleware, createCampaign);
router.get('/campaigns', authMiddleware, adminMiddleware, campaignList);
router.get('/campaigns/:id', authMiddleware, adminMiddleware, campaignDetails);
router.patch('/campaigns/:id/activate', authMiddleware, adminMiddleware, activateCampaign);
router.patch('/campaigns/:id/pause', authMiddleware, adminMiddleware, pauseCampaign);
router.patch('/campaigns/:id/unpause', authMiddleware, adminMiddleware, unpauseCampaign);

router.post('/campaigns/:id/prizes', authMiddleware, adminMiddleware, createPrize);
router.get('/campaigns/:id/prizes', authMiddleware, adminMiddleware, prizeList);

router.patch('/prizes/:id', authMiddleware, adminMiddleware, editPrize);

router.post('/campaigns/:id/codes/generate', authMiddleware, adminMiddleware, createCodeBatch);
router.get('/campaigns/:id/batches', authMiddleware, adminMiddleware, codeBatchList);
router.get('/batches/:id', authMiddleware, adminMiddleware, getCodeBatchDetails);
router.get('/batches/:id/export', authMiddleware, adminMiddleware, exportCodeBatch);

router.get('/claims', authMiddleware, adminMiddleware, getPrizeClaims);
router.patch('/claims/:id/status', authMiddleware, adminMiddleware, changeClaimStatus);

router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats);

// Reports
router.get('/reports/submissions', authMiddleware, adminMiddleware, getSubmissionReport);
router.get('/reports/winners', authMiddleware, adminMiddleware, getWinnersReport);

export default router;