import { Global, Inject, Injectable, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { MongoConnection } from '../../pkg/mongo/client';
import { toSec } from '../../pkg/utils/times';
import { env } from '../config/env';
import { logger } from '../logger/logger';

export const MONGO_CLIENT = 'MONGO_CLIENT';
export const MONGO_DB = 'MONGO_DB';

export const Collections = {
    Users: 'users',
    PasswordResets: 'password_resets',
    MealHistory: 'meal_history',
} as const;

export async function ensureIndexes(db: Db): Promise<void> {
    // 1. users collection
    await db.collection(Collections.Users).createIndexes([
        {
            key: { email: 1 },
            name: 'uq_users_email',
            unique: true,
        },
        {
            key: { google_id: 1 },
            name: 'idx_users_google_id',
            sparse: true,
        },
    ]);

    // 2. password_resets collection
    await db.collection(Collections.PasswordResets).createIndexes([
        {
            key: { user_id: 1, created_at: -1 },
            name: 'idx_password_resets_user',
        },
        {
            key: { email: 1, created_at: -1 },
            name: 'idx_password_resets_email',
        },
        {
            key: { expires_at: 1 },
            name: 'idx_password_resets_ttl',
            expireAfterSeconds: toSec.day(1),
        },
    ]);

    // 3. meal_history collection
    await db.collection(Collections.MealHistory).createIndexes([
        {
            key: { user_id: 1, created_at: -1 },
            name: 'idx_meal_history_user_date',
        },
    ]);
}

@Injectable()
export class MongoLifecycle implements OnModuleInit, OnModuleDestroy {
    constructor(
        @Inject(MONGO_CLIENT) private readonly client: MongoClient,
        @Inject(MONGO_DB) private readonly db: Db
    ) {}

    async onModuleInit() {
        await ensureIndexes(this.db);
        logger.info('MongoDB indexes ensured', { db: env.mongo.dbName });
    }

    async onModuleDestroy() {
        await this.client.close();
        logger.info('MongoDB connection closed');
    }
}

@Global()
@Module({
    providers: [
        {
            provide: MONGO_CLIENT,
            useFactory: async (): Promise<MongoClient> => {
                const connection = new MongoConnection(env.mongo.uri, env.mongo.dbName);
                const { client } = await connection.connect();
                logger.info('Pinged your deployment. You successfully connected to MongoDB!', {
                    db: env.mongo.dbName,
                });
                return client;
            },
        },
        {
            provide: MONGO_DB,
            useFactory: (client: MongoClient): Db => {
                return client.db(env.mongo.dbName);
            },
            inject: [MONGO_CLIENT],
        },
        MongoLifecycle,
    ],
    exports: [MONGO_CLIENT, MONGO_DB],
})
export class MongoModule {}

