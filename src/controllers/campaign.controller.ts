import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { CampaignStatus } from "../generated/prisma";
import { shufflePrizePool } from "../utils/code";

export const createCampaign = async (req: Request, res: Response) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        const { name, startDate, endDate } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({ message: "Name, Start Date and End dates are required." });
        }

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
        const now = new Date();

        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date format. Use ISO 8601 format."
            });
        }

        if (parsedStartDate <= now) {
            return res.status(400).json({
                message: "Start date must be in the future."
            });
        }

        if (parsedStartDate >= parsedEndDate) {
            return res.status(400).json({
                message: "Start date must be before end date."
            });
        }

        const existingCampaign = await prisma.campaign.findFirst({
            where: {
                name: name,
                status: CampaignStatus.ACTIVE
            }
        });

        if (existingCampaign) {
            return res.status(409).json({ message: "Active campaign with same name already exists." })
        }

        const campaign = await prisma.campaign.create({
            data: {
                name,
                startDate: parsedStartDate,
                endDate: parsedEndDate
            }
        });

        return res.status(200).json({
            message: "Campaign created.",
            campaignId: campaign.id
        })
    } catch (error) {
        console.error("Error during create campaign:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const campaignList = async (req: Request, res: Response) => {
    try {
        const { name, status, fromDate, toDate } = req.query;

        const parsedStartDate = new Date(fromDate as string);
        const parsedEndDate = new Date(toDate as string);

        if (status && !Object.values(CampaignStatus).includes(status as CampaignStatus)) {
            return res.status(400).json({ message: "Invalid status value." });
        }
        
        if ((fromDate && isNaN(parsedStartDate.getTime())) || (toDate && isNaN(parsedEndDate.getTime()))) {
            return res.status(400).json({
                message: "Invalid date format. Use ISO 8601 format."
            });
        }

        const campaigns = await prisma.campaign.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            where: {
                name: {
                    mode: "insensitive",
                    contains: name ? String(name) : undefined
                },
                status: status ? String(status) as CampaignStatus : undefined,
                startDate: {
                    gte: fromDate ? parsedStartDate : undefined
                },
                endDate: {
                    lte: toDate ? parsedEndDate : undefined
                }
            }
        })

        return res.status(200).json(campaigns)
    } catch (error) {
        console.error("Error during get campaign list:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const campaignDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.campaign.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        return res.status(200).json(campaign);
    } catch (error) {
        console.error("Error during get campaign list:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const activateCampaign = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.campaign.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status !== CampaignStatus.DRAFT) {
            return res.status(400).json({ message: "Only campaigns in DRAFT status can be activated." });
        }

        const batches = await prisma.codeBatch.findMany({
            where: { campaignId: Number(id) },
            include: {
                LotteryCodes: true
            }
        });

        if (batches.length === 0 || batches.some(batch => batch.LotteryCodes.length === 0)) {
            return res.status(400).json({ message: "Cannot activate campaign without at least one code batch containing codes." });
        }

        const totalCodes = batches.reduce((sum, batch) => sum + batch.LotteryCodes.length, 0);

        const prizes = await prisma.prize.findMany({
            where: { campaignId: Number(id) }
        });

        const totalAvailablePrizes = prizes.reduce((sum, prize) => sum + prize.remainingQuantity, 0);
        if (totalAvailablePrizes > totalCodes) {
            return res.status(400).json({ message: "Too many prizes for the requested number of codes." });
        }

        // Prize pool: create an array with prize IDs according to their remaining quantity, then fill the rest with null (no prize) and shuffle it
        let prizePool: (number | null)[] = [];
        prizes.forEach(prize => {
            for (let i = 0; i < prize.remainingQuantity; i++) {
                prizePool.push(prize.id);
            }
        });
        while (prizePool.length < totalCodes) {
            prizePool.push(null); // fill remaining with null (no prize)
        }
        prizePool = shufflePrizePool(prizePool);
    } catch (error) {
        console.error("Error during activate campaign:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}