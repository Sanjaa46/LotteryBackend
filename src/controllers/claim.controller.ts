import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { ClaimStatus } from "../generated/prisma/index.js";
import { sendEmail } from "../utils/mailer.js";
import { createAuditLog } from "../utils/auditLog.js";

export const getPrizeClaims = async (req: Request, res: Response) => {
    try {
        const { status, fromDate, toDate, campaign, page, pageSize } = req.query;
        const parsedFromDate = fromDate ? new Date(fromDate as string) : undefined;
        const parsedToDate = toDate ? new Date(toDate as string) : undefined;

        const where: any = {};

        if (status) {
            if (!Object.values(ClaimStatus).includes(status as ClaimStatus)) {
                return res.status(400).json({ message: "Invalid status value." });
            }
            where.status = status;
        }

        if (parsedFromDate || parsedToDate) {
            where.createdAt = {
                ...(parsedFromDate && { gte: parsedFromDate }),
                ...(parsedToDate && { lte: parsedToDate }),
            };
        }

        if (campaign) {
            where.prize = {
                campaignId: Number(campaign)
            };
        }

        const pageInt = Number(page) || 1;
        const pageSizeInt = Number(pageSize) || 10;
        const skip = (pageInt - 1) * pageSizeInt;


        const claims = await prisma.prizeClaim.findMany({
            skip,
            take: pageSizeInt,
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                prize: {
                    include: {
                        campaign: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const totalClaims = await prisma.prizeClaim.count({ where });

        return res.status(200).json({ claims, totalClaims, page: pageInt, pageSize: pageSizeInt });
    } catch (error) {
        console.error("Error fetching prize claims:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

export const changeClaimStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!Object.values(ClaimStatus).includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const claim = await prisma.prizeClaim.findUnique({
            where: { id: Number(id) },
        });

        if (!claim) {
            return res.status(404).json({ message: "Claim not found." });
        }

        if (claim.status === status) {
            return res.status(400).json({ message: `Claim is already in '${status}' status.` });
        }

        const updatedClaim = await prisma.prizeClaim.update({
            where: { id: Number(id) },
            data: { status },
        });

        if (status === ClaimStatus.APPROVED) {
            const user = await prisma.user.findUnique({
                where: { id: claim.userId },
            });

            const prize = await prisma.prize.findUnique({
                where: { id: claim.prizeId },
                include: {
                    campaign: true,
                }
            });

            if (user && prize) {
                const emailSent = await sendEmail(
                    user.email,
                    "Congratulations! Your prize claim has been approved",
                    `<p>Dear ${user.email},</p>
                    <p>We are excited to inform you that your claim for the prize "${prize.name}" in the campaign "${prize.campaign.name}" has been approved!</p>
                    <p>Please follow the instructions provided in the campaign details to redeem your prize.</p>
                    <p>Thank you for participating!</p>
                    <p>Best regards,<br/>Lottery App Team</p>`
                );

                if (!emailSent) {
                    console.error(`Failed to send email to user ${user.email} for approved claim ${claim.id}`);
                }
            }
        }

        await createAuditLog(prisma, {
            userId: req.user?.userId!,
            action: "CHANGE_CLAIM_STATUS",
            entityType: "CLAIM",
            entityId: Number(id),
            oldValue: { status: claim.status },
            newValue: { status },
            ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress),
            userAgent: String(req.headers['user-agent'] || '')
        });

        return res.status(200).json(updatedClaim);
    } catch (error) {
        console.error("Error changing claim status:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}