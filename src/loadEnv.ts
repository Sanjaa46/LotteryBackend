import * as dotenv from 'dotenv';
import path from "path";

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log(`Env loaded from ${envFile}`);