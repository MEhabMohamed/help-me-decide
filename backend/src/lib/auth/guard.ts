import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { NotAuthenticated } from './errors';
import { verfiyAccessToken } from '../../app/auth/utils';

export function extractTokenFromRequest(req: Request): string | undefined {
    if (req.cookies && req.cookies.access_token) {
        return req.cookies.access_token;
    }
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    return undefined;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();
        const token = extractTokenFromRequest(req);
        if (!token) {
            throw NotAuthenticated;
        }
        req.user = verfiyAccessToken(token);
        return true;
    }
}


