import { Response } from 'express';
import { env } from '../config/env';
import { toMs } from '../../pkg/utils/times';

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: toMs.hour(1),
    });
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: toMs.day(7),
        path: '/api/auth/refresh',
    });
}

export function clearAuthCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
}

