import { Request, Response } from "express";
import { vi, describe, it, expect } from 'vitest';
import { adminMiddleware } from "./adminMiddleware";
import jwt from "jsonwebtoken";

describe('adminMiddleware', () => {
    it('should call next() when role is admin', () => {
        // Arrange
        const req = {
            // Manually mock what authMiddleware would have produced
            user: {
                userId: 1,
                email: "admin@test.com",
                role: "admin"
            }
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        
        const next = vi.fn();

        // Act
        adminMiddleware(req, res, next);

        // Assert
        expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', () => {
        // Arrange
        const secret = 'test_secret';
        process.env.JWT_SECRET = secret;
        const payload = {
            userId: 1,
            email: "testuser@example.com",
            role: "user"
        }

        const validToken = jwt.sign(payload, secret, { expiresIn: '15min' });

        const req = {
            headers: {
                authorization: `Bearer ${validToken}`
            }
        } as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        const next = vi.fn();

        // Act
        adminMiddleware(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "You do not have permission to access this resource." });
    })
})