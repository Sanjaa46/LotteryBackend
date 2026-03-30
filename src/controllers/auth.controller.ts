import { Request, Response } from "express";
import { randomBytes, createHash } from "crypto";
import prisma from "../lib/prisma";
import redis from "../lib/redis";
import jwt from "jsonwebtoken";
import { hashPassword, comparePasswords } from "../utils/password";
import { otpCacheKey } from "../utils/cache";
import { sendEmail } from "../utils/mailer";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const register = async (req: Request, res: Response) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        // Registration logic will go here
        const { email } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }
        
        // Generate a OTP and save it in Redis with an expiration time (e.g., 5 minutes)
        const key = otpCacheKey(email, "registration");
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redis.set(key, otp, 'EX', 5 * 60); // 5 minutes in seconds

        // Send OTP to user's email
        // await sendEmail(email, "Registration OTP", `<p>Your OTP for registration is: <b>${otp}</b></p>`);
        await sendEmail("sanjaas880@gmail.com", "Registration OTP", `<p>Your OTP for registration is: <b>${otp}</b></p>`);

        return res.status(200).json({ message: "OTP sent to email", otp }); // Remove otp from response in production

    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        const { email, purpose, otp } = req.body;
        if (!email || !purpose || !otp) {
            return res.status(400).json({ message: "Email, purpose, and OTP are required" });
        }

        const key = otpCacheKey(email, purpose);
        const storedOtp = await redis.get(key);

        if (storedOtp === otp) {
            // OTP is valid, proceed with registration or password reset logic
            await redis.del(key);

            // Generate password token and save it in Redis with an expiration time (e.g., 15 minutes)
            const pwd_token = randomBytes(32).toString("hex");
            const hashed_pwd_token = createHash('sha256').update(pwd_token).digest('hex');
            await redis.set(`pwd_token:${email}`, hashed_pwd_token, 'EX', 15 * 60); // 15 minutes in seconds
            return res.status(200).json({ message: "OTP verified successfully", pwd_token });
        } else {
            return res.status(400).json({ message: "Invalid OTP" });
        }
    } catch (error) {
        console.error("Error during OTP verification:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const setPassword = async (req: Request, res: Response) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        const { email, pwd_token, password } = req.body;
        if (!email || !pwd_token || !password) {
            return res.status(400).json({ message: "Email, password token, and new password are required" });
        }

        const storedHashedToken = await redis.get(`pwd_token:${email}`);
        const incomingHashedToken = createHash('sha256').update(pwd_token).digest('hex');

        if (storedHashedToken !== incomingHashedToken) {
            return res.status(400).json({ message: "Invalid or expired password token" });
        }

        // Check if user already exists (in case of registration flow)
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        // Hash the new password and save it to the database
        const passwordHash = await hashPassword(password);
        await prisma.user.create({
            data: {
                email,
                passwordHash,
                userRoles: {
                    create: {
                        role: {
                            connect: { name: "user" }
                        }
                    }
                }
            }
        });

        // Delete the password token from Redis
        await redis.del(`pwd_token:${email}`);

        return res.status(200).json({ message: "Password set successfully" });
    } catch (error) {
        console.error("Error during setting password:", error);
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

        const userRoleMapping = await prisma.userRole.findFirst({
            where: { userId: user.id },
            include: { role: true }
        })

        const roleName = userRoleMapping?.role.name;

        // Create access token
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: roleName },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Create refresh token
        const refreshToken = randomBytes(64).toString("hex");
        const hashedRefreshToken = createHash('sha256').update(refreshToken).digest('hex');

        // Save refresh token in Redis with an expiration time
        await redis.set(
            `refresh_token:${user.id}`,
            hashedRefreshToken,
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
            roleName,
            accessToken,
        })
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const logout = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Delete the refresh token from Redis
        await redis.del(`refresh_token:${userId}`);

        // Clear the refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        return res.status(200).json({ message: "Logout successful" });

    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const tokenFromCookie = req.cookies.refreshToken;

        if (!tokenFromCookie) {
            return res.status(401).json({ message: "Refresh token is required" });
        }

        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const incomingHash = createHash('sha256').update(tokenFromCookie).digest('hex');
        const storedHash = await redis.get(`refresh_token:${userId}`);

        if (!storedHash || incomingHash !== storedHash) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            include: { userRoles: { include: { role: true } } } 
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const roleName = user.userRoles[0]?.role.name;

        // Create new access token
        const newAccessToken = jwt.sign(
            { userId: user.id, email: user.email, role: roleName },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        return res.status(200).json({
            accessToken: newAccessToken,
        });
    } catch (error) {
        console.error("Error during token refresh:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}