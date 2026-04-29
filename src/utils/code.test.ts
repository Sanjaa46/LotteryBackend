import { describe, it, expect } from '@jest/globals';
import { shufflePrizePool, generateLotteryCode } from "./code";

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