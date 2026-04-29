import type { Config } from 'jest';

const config: Config = {
    // Typescript ашиглахын тулд ts-jest-ийг preset болгон ашиглана
    preset: 'ts-jest',

    // Backend (Node.js) орчинд ажиллахыг зааж өгнө
    testEnvironment: 'node',

    // Test файлуудыг хаанаас хайхыг зааж өгөх pattern
    // Энэ нь бүх хавтас доторх .test.ts өргөтгөлтэй файлуудыг олж ажиллуулна
    testMatch: ['**/*.test.ts'],

    // Хэрэгцээгүй хавтас (жишээ нь dist) хасах
    modulePathIgnorePatterns: ['<rootDir>/dist/']
};

export default config;