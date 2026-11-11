import { NextFunction, Request, Response } from 'express';
import { cacheProvider } from '../cache/init';
import { toSec } from '../../pkg/utils/times';

export interface IdempotencyOptions {
    strict?: boolean;
}

export function idempotency(options: IdempotencyOptions = {}) {
    const { strict = false } = options;
    return async function (req: Request, res: Response, next: NextFunction) {
        if (!['POST', 'PATCH', 'PUT'].includes(req.method)) {
            return next();
        }

        const idempotencyKey = req.header('Idempotency-Key');
        if (!idempotencyKey) {
            if (strict) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing Idempotency-Key header',
                });
            }
            return next();
        }

        try {
            const key = `${req.method}:${req.originalUrl}:${idempotencyKey}`;
            const cached = await cacheProvider.get(key);
            if (cached) {
                return res.status(200).json(JSON.parse(cached));
            }

            const originalJson = res.json.bind(res);
            res.json = function (body: unknown) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    void cacheProvider.set(key, JSON.stringify(body), toSec.day(1));
                }
                return originalJson(body);
            };
            next();
        } catch {
            if (strict) {
                return res.status(503).json({
                    success: false,
                    message: 'Idempotency service unavailable',
                });
            }
            next();
        }
    };
}

