import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                userRoles: {
                    select: {
                        role: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const roles = user.userRoles.map(ur => ur.role.name);

        return res.status(200).json({
            id: user.id,
            email: user.email,
            roles
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserSubmissions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const submissions = await prisma.submission.findMany({
            where: { userId },
            include: {
                lotteryCode: {
                    include: {
                        campaign: true,
                        prize: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const formattedSubmissions = submissions.map(sub => ({
            id: sub.id,
            result: sub.result,
            ipAddress: sub.ipAddress,
            createdAt: sub.createdAt,
            lotteryCode: sub.lotteryCode.code,
            campaignName: sub.lotteryCode.campaign.name,
            prizeName: sub.lotteryCode.prize?.name || null
        }));

        return res.status(200).json(formattedSubmissions);
    } catch (error) {
        console.error("Error fetching user submissions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserPrizeClaims = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const prizeClaims = await prisma.prizeClaim.findMany({
            where: { userId },
            include: {
                submission: {
                    include: {
                        lotteryCode: {
                            include: {
                                campaign: true,
                                prize: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const formattedClaims = prizeClaims.map(claim => ({
            id: claim.id,
            createdAt: claim.createdAt,
            campaignName: claim.submission.lotteryCode.campaign.name,
            prizeName: claim.submission.lotteryCode.prize?.name || null,
            submissionResult: claim.submission.result,
            status: claim.status
        }));

        return res.status(200).json(formattedClaims);
    } catch (error) {
        console.error("Error fetching user prize claims:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}