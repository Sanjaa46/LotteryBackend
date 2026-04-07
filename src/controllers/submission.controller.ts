import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { CampaignStatus } from "../generated/prisma";

export const submitLotteryCode = async (req: Request, res: Response) => {
    try {

    } catch (error) {
        console.error("Error submitting lottery code:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}