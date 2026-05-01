import type  { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header is missing" });
        }

        // Get only Bearer token
        const token = authHeader.split(' ')[1];
        const tokenType = authHeader.split(' ')[0];
        if (tokenType !== 'Bearer') {
            return res.status(401).json({ message: "Authorization header must start with Bearer" });
        }
        if (!token) {
            return res.status(401).json({ message: "Token is missing" });
        }

        // Verify JWT token
        const secret = process.env.JWT_SECRET || 'test_secret';
        const decoded = jwt.verify(token, secret) as { userId: number, email: string, role?: string };
        if (!decoded) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Attach user information to the request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            ...(decoded.role && { role: decoded.role })
        }

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token has expired" });
        }
        
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid token" });
        }

        console.error("Error in auth middleware:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}