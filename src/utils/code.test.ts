import { describe, it, expect } from 'vitest';
import { shufflePrizePool, generateLotteryCode } from "./code.js";

describe('shufflePrizePool', () => {
    describe('given an array of numbers and nulls', () => {
        it('should return a shuffled array', () => {
            // Arrange
            const array = [1, 2, 3, null, 4, null]

            // Act
            const result = shufflePrizePool(array)

            // Assert
            expect(result).toHaveLength(array.length)
            expect(result).toEqual(expect.arrayContaining(array))
        })
    })
})

describe('generateLotteryCode', () => {
    it('should return a unique string of length 10', () => {
        // Arrange
        const allowedChars = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
        const count = 1000
        const codes = new Set<string>()

        // Act + Assert
        for (let i = 0; i < count; i++) {
            const code = generateLotteryCode()

            // Uniqueness check
            expect(codes.has(code)).toBe(false)

            codes.add(code)

            expect(code).toHaveLength(10)
            for (const char of code) {
                expect(allowedChars.has(char)).toBe(true)
            }
        }

        // Assert uniqueness
        expect(codes.size).toBe(count)

    })
})