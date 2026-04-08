import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { ClaimStatus } from "../generated/prisma";

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