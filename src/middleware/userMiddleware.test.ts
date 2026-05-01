import type { Request, Response } from "express";
import { vi, describe, it, expect } from 'vitest';
import { userMiddleware } from "./userMiddleware.js";
import jwt from "jsonwebtoken";

describe('userMiddleware', () => {
    it('should call next() when role is user', () => {
        // Arrange
        const req = {
            // Manually mock what authMiddleware would have produced
            user: {
                userId: 1,
                email: "testuser@example.com",
                role: "user"
            }
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        
        const next = vi.fn();

        // Act
        userMiddleware(req, res, next);

        // Assert
        expect(next).toHaveBeenCalled();
    })

    it('should return 403 if role is not user', () => {
        // Arrange
        const req = {
            // Manually mock what authMiddleware would have produced
            user: {
                userId: 1,
                email: "testuser@example.com",
                role: "admin"
            }
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        
        const next = vi.fn();

        // Act
        userMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Only users can access this resource" });
        expect(next).not.toHaveBeenCalled();
    })
})