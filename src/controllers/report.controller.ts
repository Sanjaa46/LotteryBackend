import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { stringify } from "csv-stringify/sync";

export const getSubmissionReport = async (req: Request, res: Response) => {
    try {
        const { campaignId, fromDate, toDate } = req.query;
        
        if (!campaignId) {
            return res.status(400).json({ message: "Campaign ID is required." });
        }

        const whereClause: any = {
            lotteryCode: {
                campaignId: Number(campaignId)
            }
        };

        if (fromDate) {
            whereClause.createdAt = { gte: new Date(fromDate as string) };
        }

        if (toDate) {
            whereClause.createdAt = whereClause.createdAt || {};
            whereClause.createdAt.lte = new Date(toDate as string);
        }

        const submissions = await prisma.submission.findMany({
            where: whereClause,
            include: {
                lotteryCode: {
                    include: {
                        campaign: true,
                        prize: true
                    }
                },
                user: true
            }
        });

        const csvData = submissions.map(submission => ({
            id: submission.id,
            userId: submission.userId,
            userEmail: submission.user?.email || "",
            lotteryCode: submission.lotteryCode.code,
            campaignName: submission.lotteryCode.campaign.name,
            prizeName: submission.lotteryCode.prize?.name || "",
            result: submission.result,
            createdAt: submission.createdAt.toISOString()
        }));

        const csvString = stringify(csvData, { header: true });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="submission_report_${campaignId}.csv"`);
        res.send(csvString);
    } catch (error) {
        console.error("Error fetching submission report:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

export const getWinnersReport = async (req: Request, res: Response) => {
    try {
        const { campaignId } = req.query;
        
        if (!campaignId) {
            return res.status(400).json({ message: "Campaign ID is required." });
        }

        const winners = await prisma.prizeClaim.findMany({
            where: {
                prize: {
                    campaignId: Number(campaignId)
                }
            },
            include: {
                submission: {
                    include: {
                        user: true
                    }
                },
                prize: true
            }
        });

        const csvData = winners.map(claim => ({
            id: claim.id,
            userId: claim.userId,
            userEmail: claim.submission.user?.email || "",
            prizeName: claim.prize.name,
            claimedAt: claim.createdAt.toISOString()
        }));

        const csvString = stringify(csvData, { header: true });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="winners_report_${campaignId}.csv"`);
        res.send(csvString);
    } catch (error) {
        console.error("Error fetching winners report:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}