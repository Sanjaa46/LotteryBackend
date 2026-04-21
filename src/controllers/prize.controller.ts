import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { createAuditLog } from "../utils/auditLog";

export const createPrize = async (req: Request, res: Response) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        const { id } = req.params;
        const { name, type, totalQuantity } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Campaign ID is required." });
        }

        if (!name || !type || totalQuantity === undefined) {
            return res.status(400).json({ message: "Name, Type and Total Quantity are required." });
        }

        if (isNaN(Number(totalQuantity)) || Number(totalQuantity) <= 0) {
            return res.status(400).json({ message: "Total Quantity must be a positive number." });
        }

        const campaign = await prisma.campaign.findUnique({
            where: { id: Number(id) }
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found." });
        }

        const existingPrizes = await prisma.prize.findMany({
            where: {
                campaignId: Number(id),
                name: name
            }
        });

        if (existingPrizes.length > 0) {
            return res.status(400).json({ message: "Prize with the same name already exists in this campaign." });
        }

        const prize = await prisma.$transaction(async (tx) => {
            const prize = await tx.prize.create({
                data: {
                    name: name,
                    type: type,
                    totalQuantity: Number(totalQuantity),
                    remainingQuantity: Number(totalQuantity),
                    campaignId: campaign.id
                }
            });

            await createAuditLog(tx, {
                userId: req.user?.userId!,
                action: "CREATE_PRIZE",
                entityType: "PRIZE",
                entityId: prize.id,
                oldValue: null,
                newValue: { name, type, totalQuantity },
                ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress),
                userAgent: String(req.headers['user-agent'] || '')
            });

            return prize;
        })

        return res.status(200).json({
            message: "Prize created.",
            prizeId: prize.id
        });

    } catch (error) {
        console.error("Error during create prize:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const prizeList = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Campaign ID is required." });
        }

        const campaign = await prisma.campaign.findUnique({
            where: { id: Number(id) }
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found." });
        }

        const prizes = await prisma.prize.findMany({
            where: {
                campaignId: Number(id)
            }
        });

        return res.status(200).json({prizes});
    } catch (error) {
        console.error("Error during get prize list:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const editPrize = async (req: Request, res: Response) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        const { id } = req.params;
        const { name, type, totalQuantity } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Prize ID is required." });
        }

        const prize = await prisma.prize.findUnique({
            where: { id: Number(id) }
        });

        if (!prize) {
            return res.status(404).json({ message: "Prize not found." });
        }

        const updatedData: any = {};

        if (name) updatedData.name = name;
        if (type) updatedData.type = type;
        if (totalQuantity !== undefined) {
            const quantityDifference = Number(totalQuantity) - prize.totalQuantity;
            updatedData.totalQuantity = Number(totalQuantity);
            updatedData.remainingQuantity = prize.remainingQuantity + quantityDifference;

            if (updatedData.remainingQuantity < 0) {
                return res.status(400).json({ message: "Total quantity cannot be less than the number of prizes already awarded." });
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.prize.update({
                where: { id: Number(id) },
                data: updatedData
            });

            await createAuditLog(tx, {
                userId: req.user?.userId!,
                action: "EDIT_PRIZE",
                entityType: "PRIZE",
                entityId: Number(id),
                oldValue: { name: prize.name, type: prize.type, totalQuantity: prize.totalQuantity },
                newValue: { name: updatedData.name || prize.name, type: updatedData.type || prize.type, totalQuantity: updatedData.totalQuantity || prize.totalQuantity },
                ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress),
                userAgent: String(req.headers['user-agent'] || '')
            });
        });

        return res.status(200).json({ message: "Prize updated." });
    } catch (error) {
        console.error("Error during edit prize:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}