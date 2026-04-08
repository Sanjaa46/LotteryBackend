import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { CampaignStatus, SubmissionResult } from "../generated/prisma";

export const submitLotteryCode = async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        let isWin = false;
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if (!code) {
            return res.status(400).json({ message: "Lottery code is required" });
        }

        const lotteryCode = await prisma.lotteryCode.findUnique({
            where: { code },
            include: {
                campaign: true
            }
        });

        if (!lotteryCode) {
            return res.status(404).json({ message: "Invalid lottery code." });
        }

        if (lotteryCode.isUsed) {
            return res.status(400).json({ message: "This lottery code has already been used." });
        }

        if (lotteryCode?.prizeId) {
            isWin = true;
        }

        // Find the campaign associated with the lottery code
        const campaign = lotteryCode.campaign;
        const now = new Date();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found." });
        }

        if (campaign.status !== CampaignStatus.ACTIVE) {
            return res.status(400).json({ message: "Campaign is not active." });
        }

        // TODO: Uncomment the following lines if you want to enforce campaign start and end dates
        // if (campaign.startDate > now) {
        //     return res.status(400).json({ message: "Campaign has not started yet." });
        // } else if (campaign.endDate < now) {
        //     return res.status(400).json({ message: "Campaign has already ended." });
        // }

        try {
            await prisma.$transaction(async (tx) => {
                if (isWin) {
                    const submission = await tx.submission.create({
                        data: {
                            userId: req.user?.userId!,
                            lotteryCodeId: lotteryCode!.id,
                            result: SubmissionResult.WIN,
                            ipAddress: String(ipAddress),
                        }
                    });

                    await tx.prizeClaim.create({
                        data: {
                            submissionId: submission.id,
                            userId: req.user?.userId!,
                            prizeId: lotteryCode!.prizeId!,
                        }
                    });
                } else {
                    await tx.submission.create({
                        data: {
                            userId: req.user?.userId!,
                            lotteryCodeId: lotteryCode!.id,
                            result: SubmissionResult.LOSE,
                            ipAddress: String(ipAddress),
                        }
                    })
                }

                await prisma.lotteryCode.update({
                    where: { id: lotteryCode.id },
                    data: { isUsed: true }
                });
            })
        } catch (error) {
            console.error("Error recording submission:", error);
            return res.status(500).json({ message: "Internal server error." });
        }

        if (isWin) {
            return res.status(200).json({ message: "Congratulations! You've won a prize." });
        } else {
            return res.status(200).json({ message: "Sorry, better luck next time!" });
        }
    } catch (error) {
        console.error("Error submitting lottery code:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}