import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../lib/config/env';
import crypto from 'crypto';
import { AppError } from '../../lib/error/AppError';

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export interface JwtPayload {
    userId: string;
    email: string;
    name?: string;
}

export function createAccessToken(payload: JwtPayload): string {
    const options: SignOptions = {
        expiresIn: Number(env.jwt.accessExpiresIn),
    };
    return jwt.sign(payload, env.jwt.accessSecret, options);
}

export function createRefreshToken(payload: JwtPayload): string {
    const options: SignOptions = {
        expiresIn: Number(env.jwt.refreshExpiresIn),
    };
    return jwt.sign(payload, env.jwt.refreshSecret, options);
}

export function verfiyAccessToken(token: string): JwtPayload {
    try {
        return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
    } catch {
        throw new AppError('Invalid or expired access token', 401);
    }
}

export function verfiyRefreshToken(token: string): JwtPayload {
    try {
        return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
    } catch {
        throw new AppError('Invalid or expired refresh token', 401);
    }
}

export function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

export async function hashOTP(otp: string): Promise<string> {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

