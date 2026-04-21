import { Request, Response } from "express";
import { randomBytes, createHash } from "crypto";
import prisma from "../lib/prisma";
import { UserStatus } from "../generated/prisma";
import redis from "../lib/redis";
import jwt from "jsonwebtoken";
import { hashPassword, comparePasswords } from "../utils/password";
import { otpCacheKey } from "../utils/cache";
import { sendEmail } from "../utils/mailer";
import { createAuditLog } from "../utils/auditLog";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const accessTokenExpiry = '15m';
const refreshTokenExpiry = 7 * 24 * 60 * 60;

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
        await sendEmail(email, "Registration OTP", `<p>Your OTP for registration is: <b>${otp}</b></p>`);

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

        if (!storedOtp) {
            return res.status(400).json({ message: "OTP has expired, please request a new one" })
        }

        const attempts_key = `otp_attempts:${purpose}:${email}`;
        const attempts = await getAttemptsCounterValue(attempts_key)

        if (attempts >= 5) {
            return res.status(429).json({ message: "Too many attempts." });
        }

        if (storedOtp === otp) {
            // OTP is valid, proceed with registration or password reset logic
            await redis.del(key);
            await redis.del(attempts_key)

            // Generate password token and save it in Redis with an expiration time (e.g., 15 minutes)
            const pwd_token = randomBytes(32).toString("hex");
            const hashed_pwd_token = createHash('sha256').update(pwd_token).digest('hex');
            await redis.set(`pwd_token:${email}`, hashed_pwd_token, 'EX', 15 * 60); // 15 minutes in seconds
            return res.status(200).json({ message: "OTP verified successfully", pwd_token });
        } else {
            await redis.incrby(attempts_key, 1)
            await redis.expire(attempts_key, 5 * 60)
            return res.status(400).json({ message: "Invalid OTP" });
        }
    } catch (error) {
        console.error("Error during OTP verification:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getAttemptsCounterValue = async (key: string): Promise<number> => {
    try {
        const value = await redis.get(key);
        // Redis stores numbers as strings
        return value ? parseInt(value, 10) : 0;
    } catch (error) {
        console.error(`Error getting counter value for ${key}:`, error);
        throw error;
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

        // Delete the password token from Redis
        await redis.del(`pwd_token:${email}`);

        const passwordHash = await hashPassword(password);
        
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Create new user
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
        } else {
            await prisma.user.update({
                where: { email },
                data: {passwordHash}
            })
        }


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
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check if user is suspended or blocked
        if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BLOCKED) {
            return res.status(403).json({ message: "Your account suspended or blocked."})
        }

        if (!(await comparePasswords(password, user.passwordHash))) {
            // Audit log for failed login attempt can be added here
            await createAuditLog(prisma, {
                userId: user.id,
                action: "INCORRECT_PASSWORD",
                entityType: "User",
                entityId: user.id,
                oldValue: null,
                newValue: { email },
                ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress),
                userAgent: req.headers['user-agent'] || "Unknown",
            });
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
            { expiresIn: accessTokenExpiry }
        );

        // Create refresh token
        const refreshToken = randomBytes(64).toString("hex");
        const hashedRefreshToken = createHash('sha256').update(refreshToken).digest('hex');

        // Save refresh token in Redis with an expiration time
        await redis.set(
            `refresh_token:${hashedRefreshToken}`,
            user.id,
            'EX',
            refreshTokenExpiry // 7 days in seconds
        )

        // Return tokens. Save refresh token in an HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: refreshTokenExpiry * 1000 // 7 days in milliseconds
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
        const refreshToken = req.cookies.refreshToken

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Delete the refresh token from Redis
        const hashedRefreshToken = createHash('sha256').update(refreshToken).digest('hex');
        await redis.del(`refresh_token:${hashedRefreshToken}`);

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
        const tokenFromCookie = req.cookies?.refreshToken;

        if (!tokenFromCookie) {
            return res.status(401).json({ message: "Refresh token is required" });
        }

        const incomingHash = createHash('sha256').update(tokenFromCookie).digest('hex')
        const userId = Number(await redis.get(`refresh_token:${incomingHash}`));
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            include: { userRoles: { include: { role: true } } } 
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is suspended or blocked
        if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BLOCKED) {
            await redis.del(`refresh_token:${incomingHash}`)
                res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });
            return res.status(403).json({ message: "Your account suspended or blocked."})
        }

        const roleName = user.userRoles[0]?.role.name;

        // Create new access token
        const newAccessToken = jwt.sign(
            { userId: user.id, email: user.email, role: roleName },
            JWT_SECRET,
            { expiresIn: accessTokenExpiry }
        );

        // Refresh Token Rotation
        await redis.del(`refresh_token:${incomingHash}`);
        const refreshToken = randomBytes(64).toString("hex");
        const hashedRefreshToken = createHash('sha256').update(refreshToken).digest('hex');

        // Save refresh token in Redis with an expiration time
        await redis.set(
            `refresh_token:${hashedRefreshToken}`,
            user.id,
            'EX',
            refreshTokenExpiry // 7 days in seconds
        )

        // Return tokens. Save refresh token in an HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: refreshTokenExpiry * 1000 // 7 days in milliseconds
        })

        return res.status(200).json({
            accessToken: newAccessToken,
        });
    } catch (error) {
        console.error("Error during token refresh:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        // Login logic will go here
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required!" });
        }

        const user = await prisma.user.findUnique({ where: {email} });
        if (!user) {
            return res.status(404).json({ message: "User not found!"});
        }

        // Check if user is suspended or blocked
        if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BLOCKED) {
            return res.status(403).json({ message: "Your account suspended or blocked."})
        }

        const key = otpCacheKey(email, 'forgot_password');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redis.set(key, otp, 'EX', 5 * 60);

        const sent = sendEmail(email, "Forgot password OTP", `<p>Your OTP for forgot password is: ${otp}</p>`);
        
        if (!sent) {
            return res.status(500).json({ message: "Failed to send email."})
        }

        return res.status(200).json({ message: "OTP sent to email.", otp})
    } catch (error) {
        console.error("Error during forgot password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}