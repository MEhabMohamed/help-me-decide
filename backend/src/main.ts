import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { env } from './lib/config/env';
import { correlationId } from './lib/correlation/correlationId';
import { idempotency } from './lib/idempotency/idempotency';
import { GlobalErrorFilter } from './lib/error/errorHandler.filter';
import { logger } from './lib/logger/logger';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    // Core-service middleware stack (app.use dependencies)
    app.use(helmet());
    app.use(
        cors({
            origin: env.cors.origins,
            credentials: true,
        })
    );
    app.set('query parser', 'extended');
    app.use(express.json({ limit: '10mb' }));
    app.use(correlationId);
    app.use(cookieParser());
    // Enforce strict Idempotency-Key on /api/auth/forgot-password (matching core-service)
    app.use('/api/auth/forgot-password', idempotency({ strict: true }));
    // Support optional Idempotency-Key deduplication on all other POST/PUT/PATCH endpoints
    app.use(idempotency());

    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalErrorFilter());

    app.enableShutdownHooks();

    await app.listen(env.port);
    logger.info('Help Me Decide NestJS Server started', {
        port: env.port,
        env: env.nodeEnv,
    });
}

bootstrap().catch((err) => {
    logger.error('Failed to bootstrap NestJS application', {
        error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
});

