import { Request, Response } from "express";
import { vi, describe, it, expect } from 'vitest';
import { authMiddleware } from "./authMiddleware";
import jwt from "jsonwebtoken";

describe('authMiddleware', () => {
    it('should return 401 if Authorization header is missing', () => {
        // Arrange
        const req = {
            headers: {}
        } as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        const next = vi.fn();

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Authorization header is missing" });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is missing', () => {
        // Arrange
        const req = {
            headers: {
                authorization: "Bearer "
            }
        } as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        const next = vi.fn();

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token is missing" });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
        // Arrange
        const req = {
            headers: {
                authorization: "Bearer invalid_token"
            }
        } as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        const next = vi.fn();

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token has expired', () => {
        // Arrange
        const secret = 'test_secret';
        process.env.JWT_SECRET = secret;
        const expiredPayload = {
            userId: 1,
            email: "testuser@example.com",
            role: "user"
        }

        const expiredToken = jwt.sign(expiredPayload, secret, { expiresIn: '0s' }); // Token that expired 1 second ago

        const req = {
            headers: {
                authorization: `Bearer ${expiredToken}`
            }
        } as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        const next = vi.fn();

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token has expired" });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next and attach user info to req on valid token', () => {
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
        const res = {} as Response;
        const next = vi.fn();

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({
            userId: payload.userId,
            email: payload.email,
            role: payload.role
        });
    })

    it('should return 401 if Authorization header does not start with Bearer', () => {
        // Arrange
        const req = {
            headers: {
                authorization: "Basic some_token"
            }
        } as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;
        const next = vi.fn();

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Authorization header must start with Bearer" });
        expect(next).not.toHaveBeenCalled();
    })
})
