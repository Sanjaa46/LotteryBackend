import prisma from "../lib/prisma";
import { Request, Response } from "express";
import { CampaignStatus, UserStatus } from "../generated/prisma";

export const getCampaignStatuses = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to access this resource."})
        }

        const statuses = Object.values(CampaignStatus);

        return res.json(statuses);
    } catch (error) {
        console.error("Error fetching campaign statuses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserStatuses = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to access this resource."})
        }

        const statuses = Object.values(UserStatus);

        return res.json(statuses);
    } catch (error) {
        console.error("Error fetching user statuses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}