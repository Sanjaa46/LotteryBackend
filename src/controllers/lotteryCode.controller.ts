import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { generateLotteryCode } from "../utils/code";

const MAX_CODES_PER_BATCH = 1000;

export const createCodeBatch = async (req: Request, res: Response) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        const { id } = req.params;
        const { count } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!id) {
            return res.status(400).json({ message: "Prize ID is required." });
        }

        if (isNaN(Number(count)) || Number(count) <= 0) {
            return res.status(400).json({ message: "Count must be a positive number." });
        }

        if (Number(count) > MAX_CODES_PER_BATCH) {
            return res.status(400).json({ message: "Too many codes requested." });
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                // Create code batch
                const batch = await tx.codeBatch.create({
                    data: {
                        campaignId: Number(id),
                        totalCodes: Number(count),
                        generatedBy: Number(userId)!
                    }
                });
                // Generate codes (bulk insert)
                const codes = [];
                for (let i = 0; i < count; i++) {
                    codes.push({
                        code: generateLotteryCode(),
                        campaignId: Number(id),
                        batchId: batch.id
                    });
                }

                // Prisma limitation: large insert -> chunk it
                const chunkSize = 500;
                for (let i = 0; i < codes.length; i += chunkSize) {
                    await tx.lotteryCode.createMany({
                        data: codes.slice(i, i + chunkSize),
                        skipDuplicates: true //avoid rare collision
                    });
                }

                return batch;
            });
            return res.status(200).json({
                message: "Batch created successfully",
                batch: result,
            });
        } catch (error) {
            console.error("Error during code generation transaction:", error);
            return res.status(500).json({ message: "Error generating codes" });
        }
    } catch (error) {
        console.error("Error during create code batch:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const codeBatchList = async (req: Request, res: Response) => {
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

        const batches = await prisma.codeBatch.findMany({
            where: { campaignId: Number(id) },
            include: {
                _count: {
                    select: { LotteryCodes: true }
                }
            }
        });

        return res.status(200).json({ batches });

    } catch (error) {
        console.error("Error during get code batch list:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getCodeBatchDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Batch ID is required." });
        }

        const batch = await prisma.codeBatch.findUnique({
            where: { id: Number(id) },
            include: {
                LotteryCodes: {
                    select: {
                        code: true,
                        isUsed: true,
                        prize: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!batch) {
            return res.status(404).json({ message: "Batch not found." });
        }

        return res.status(200).json({ batch });
    } catch (error) {
        console.error("Error during get code batch details:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}