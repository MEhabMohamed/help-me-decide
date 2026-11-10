import { config } from 'dotenv';
import path from 'path';
import { z } from 'zod';

config({
    path: path.resolve(__dirname, '../../../.env'),
});

const schema = z.object({
    PORT: z.string().default('5000'),
    NODE_ENV: z.string().default('development'),
    CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
    FRONTEND_URL: z.string().default('http://localhost:5173'),
    MONGO_URI: z.string().default('mongodb://localhost:27017'),
    MONGO_DB: z.string().default('help_me_decide'),
    ACCESS_SECRET: z.string(),
    REFRESH_SECRET: z.string(),
    ACCESS_EXPIRES_IN: z.string().default('3600'),
    REFRESH_EXPIRES_IN: z.string().default('604800'),
    EMAIL_USER: z.string(),
    EMAIL_PASS: z.string(),
    EMAIL_HOST: z.string().default('smtp.gmail.com'),
    EMAIL_PORT: z.string().default('587'),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
});

const parsed = schema.parse(process.env);

export const env = {
    port: Number(parsed.PORT),
    nodeEnv: parsed.NODE_ENV,
    frontendUrl: parsed.FRONTEND_URL,
    mongo: {
        uri: parsed.MONGO_URI,
        dbName: parsed.MONGO_DB,
    },
    jwt: {
        accessSecret: parsed.ACCESS_SECRET,
        refreshSecret: parsed.REFRESH_SECRET,
        accessExpiresIn: parsed.ACCESS_EXPIRES_IN,
        refreshExpiresIn: parsed.REFRESH_EXPIRES_IN,
    },
    cors: {
        origins: parsed.CORS_ORIGIN.split(',').map((o) => o.trim()),
    },
    email: {
        user: parsed.EMAIL_USER,
        pass: parsed.EMAIL_PASS,
        host: parsed.EMAIL_HOST,
        port: Number(parsed.EMAIL_PORT),
    },
    google: {
        clientId: parsed.GOOGLE_CLIENT_ID,
        clientSecret: parsed.GOOGLE_CLIENT_SECRET,
    },
};

