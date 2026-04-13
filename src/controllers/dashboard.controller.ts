import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { CampaignStatus } from "../generated/prisma";
import redis from "../lib/redis";

/**
 * Fetches overall statistics for the dashboard, including:
 * - total codes
 * - used codes
 * - winner count
 * - claim stats
 * @param req campaignId (optional) - if provided, filters stats for the specific campaign
 * @param res JSON response with the stats or an error message
 */
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const campaignId = req.query.campaignId
            ? Number(req.query.campaignId)
            : undefined;

        if (req.query.campaignId !== undefined && isNaN(campaignId!)) {
            return res.status(400).json({ message: "Invalid campaignId" });
        }

        const cachedStats = await redis.get(`dashboardStats:${campaignId ?? 'all'}`);
        if (cachedStats) {
            return res.json(JSON.parse(cachedStats));
        }

        const campaignWhere = {
            status: CampaignStatus.ACTIVE,
            ...(campaignId !== undefined && { id: campaignId }),
        };

        const [totalCodes, usedCodes, winnerCount, claimStats] = await Promise.all([
            prisma.lotteryCode.count({
                where: { campaign: campaignWhere },
            }),
            prisma.lotteryCode.count({
                where: { campaign: campaignWhere, isUsed: true },
            }),
            prisma.lotteryCode.count({
                where: { campaign: campaignWhere, isUsed: true, prizeId: { not: null } },
            }),
            prisma.prizeClaim.groupBy({
                by: ['status'],
                _count: { status: true },
                where: {
                    submission: {
                        lotteryCode: {
                            campaign: campaignWhere,
                        },
                    },
                },
            }),
        ]);

        await redis.set(`dashboardStats:${campaignId ?? 'all'}`, JSON.stringify({ totalCodes, usedCodes, winnerCount, claimStats }), 'EX', 60);

        return res.json({ totalCodes, usedCodes, winnerCount, claimStats });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};