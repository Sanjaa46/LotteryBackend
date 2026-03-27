import { Request, Response } from "express";
import prisma from "../lib/prisma";
import redis from "../lib/redis";
import jwt from "jsonwebtoken";
import { hashPassword, comparePasswords } from "../utils/password";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const register = async (req: Request, res: Response) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        // Registration logic will go here
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Creae the user in the database
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                userRoles: {
                    create: {
                        role: { connect: { name: "user" } }
                    }
                }
            }
        });

        return res.status(201).json({ message: "User registered successfully", userEmail: newUser.email });

    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        // Login logic will go here
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await comparePasswords(password, user.passwordHash))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Create access token
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Create refresh token
        const refreshToken = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Save refresh token in Redis with an expiration time
        await redis.set(
            `refresh_token:${user.id}`,
            refreshToken,
            'EX',
            7 * 24 * 60 * 60 // 7 days in seconds
        )

        // Return tokens. Save refresh token in an HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        })

        return res.status(200).json({
            message: "Login successful",
            accessToken,
        })
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}