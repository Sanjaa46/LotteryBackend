import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { hashPassword } from "../utils/password";

export const register = async (req: Request, res: Response) => {
    try {
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
                passwordHash: hashedPassword
            }
        })

        return res.status(201).json({ message: "User registered successfully", userId: newUser.email });

    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}