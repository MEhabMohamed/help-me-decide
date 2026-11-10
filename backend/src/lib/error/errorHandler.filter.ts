import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { logger } from '../logger/logger';
import { AppError } from './AppError';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
    catch(err: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();

        if (err instanceof AppError) {
            logger.error(err.message, {
                statusCode: err.statusCode,
                stack: err.stack,
                operational: err.isOperational,
                path: req.originalUrl,
                correlationId: req.correlationId,
            });

            if (err.isOperational) {
                return res.status(err.statusCode).json({
                    success: false,
                    error: err.message,
                });
            }
        }

        if (err instanceof HttpException) {
            const status = err.getStatus();
            const responseBody = err.getResponse();
            const message =
                typeof responseBody === 'string'
                    ? responseBody
                    : (responseBody as Record<string, unknown>)?.message || err.message;

            const finalMessage = Array.isArray(message) ? message.join(', ') : String(message);

            logger.error(finalMessage, {
                statusCode: status,
                path: req.originalUrl,
                correlationId: req.correlationId,
            });

            return res.status(status).json({
                success: false,
                error: finalMessage,
            });
        }

        const unknownErr = err as Error;
        logger.error(unknownErr?.message || 'Unexpected error', {
            statusCode: 500,
            stack: unknownErr?.stack,
            operational: false,
            path: req.originalUrl,
            correlationId: req.correlationId,
        });

        return res.status(500).json({
            success: false,
            error: 'Something went wrong',
        });
    }
}

