export const otpCacheKey = (email: string, purpose: string) => {
    return `otp:${purpose}:${email}`;
};