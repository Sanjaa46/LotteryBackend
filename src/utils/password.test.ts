import { describe, it, expect } from 'vitest';
import { hashPassword, comparePasswords } from "./password.js";

describe('hashPassword', () => {
    it('should return a string', async () => {
        // Arrange
        const password = 'mySecret123'

        // Act
        const result = await hashPassword(password)

        // Assert
        expect(typeof result).toBe('string')
    })
})

describe('comparePasswords', () => {
    it('should return true for correct password', async () => {
        // Arrange
        const password = 'mySecret123'
        const hashedPassword = await hashPassword(password)

        // Act
        const result = await comparePasswords(password, hashedPassword)

        // Assert
        expect(result).toBe(true)
    })
})