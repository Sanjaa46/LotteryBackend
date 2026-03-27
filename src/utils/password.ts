import * as bcrypt from "bcrypt";

const saltRounds = 10;
/**
 * Hashes a plain text password.
 * @param password User's plain text password
 * @returns A promise that resolves to the hashed password string
 */
async function hashPassword(password: string): Promise<string> {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

/**
 * Compares a plain text password with a hashed password.
 * @param plainPassword User's plain text password
 * @param hashedPassword Hashed password
 * @returns A promise that resolves to a boolean indicating if they match.
 */
async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    const match = await bcrypt.compare(plainPassword, hashedPassword);
    return match;
}

export { hashPassword, comparePasswords };