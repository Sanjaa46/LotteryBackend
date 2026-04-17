import "dotenv/config";
import { Redis } from "ioredis";

const redis = new Redis({
    host: process.env.REDIS_URL || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
});

export default redis;