import { Redis } from "ioredis";

const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL) 
  : new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
    });

redis.on("error", (err) => console.error("Redis Client Error", err));

export default redis;