import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header is missing" });
        }

        // Get only Bearer token
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Token is missing" });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, email: string, role?: string };
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        }

        next();
    } catch (error) {
        console.error("Error in auth middleware:", error);
        res.status(401).json({ message: "Unauthorized" });
    }
}