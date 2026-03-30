import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { CampaignStatus } from "../generated/prisma";

export const createCampaign = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to access this resource."})
        }

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
        if (req.user?.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to access this resource."})
        }

        const campaigns = await prisma.campaign.findMany({
            orderBy: {
                createdAt: 'desc'
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
        if (req.user?.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to access this resource."})
        }

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

export const changeCampaignStatus = async (req: Request, res: Response) => {
    
}