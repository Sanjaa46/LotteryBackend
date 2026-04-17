import { Request } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import redisStore from "rate-limit-redis";
import redis from "../lib/redis";

export const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,

    store: new redisStore({
        sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as any,
        prefix: 'rl',
    })
})

export const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // limit each IP to 5 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        if (req.user) {
            return `user:${req.user.userId}`;
        }

        const ipAddress = req.ip ?? 'unknown';
        const normalizedIp = ipKeyGenerator(ipAddress);

        return `submit_${normalizedIp}`;
    },
    store: new redisStore({
        sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as any,
        prefix: 'submit_rl',
    })
})