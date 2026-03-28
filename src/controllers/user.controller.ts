import { Request, Response } from "express";
import prisma from "../lib/prisma";

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