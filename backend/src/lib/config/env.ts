import { config } from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { toSec } from '../../pkg/utils/times';

config({
    path: path.resolve(__dirname, '../../../.env'),
});

const schema = z.object({
    PORT: z.string(),
    NODE_ENV: z.string(),
    CORS_ORIGIN: z.string(),
    FRONTEND_URL: z.string(),
    MONGO_URI: z.string(),
    MONGO_DB: z.string(),
    ACCESS_SECRET: z.string(),
    REFRESH_SECRET: z.string(),
    ACCESS_EXPIRES_IN: z.string().default(String(toSec.hour(1))),
    REFRESH_EXPIRES_IN: z.string().default(String(toSec.day(7))),
    EMAIL_USER: z.string(),
    EMAIL_PASS: z.string(),
    EMAIL_HOST: z.string(),
    EMAIL_PORT: z.string(),
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

