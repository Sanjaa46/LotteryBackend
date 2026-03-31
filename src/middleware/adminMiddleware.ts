import { Request, Response, NextFunction } from "express";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to access this resource." });
        }
        next();
    } catch (error) {
        console.error("Error in auth middleware:", error);
        res.status(401).json({ message: "Unauthorized" });
    }
};