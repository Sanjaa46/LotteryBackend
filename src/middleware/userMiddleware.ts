import type { Request, Response, NextFunction } from "express";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== "user") {
            return res.status(403).json({ message: "Only users can access this resource" });
        }
        next();
    } catch (error) {
        console.error("Error in auth middleware:", error);
        res.status(401).json({ message: "Unauthorized" });
    }
}