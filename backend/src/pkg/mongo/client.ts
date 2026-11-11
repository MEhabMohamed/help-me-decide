import { Db, MongoClient } from 'mongodb';
import { toMs } from '../utils/times';

export class MongoConnection {
    private client: MongoClient | null = null;
    private database: Db | null = null;

    constructor(
        private readonly uri: string,
        private readonly dbName: string
    ) {}

    async connect(): Promise<{ client: MongoClient; db: Db }> {
        const client = new MongoClient(this.uri, {
            maxPoolSize: 50,
            minPoolSize: 5,
            connectTimeoutMS: toMs.second(10),
            serverSelectionTimeoutMS: toMs.second(10),
        });

        await client.connect();
        const db = client.db(this.dbName);
        await db.command({ ping: 1 });

        this.client = client;
        this.database = db;
        return { client, db };
    }

    getDb(): Db {
        if (!this.database) {
            throw new Error('MongoConnection is not connected');
        }
        return this.database;
    }

    getClient(): MongoClient {
        if (!this.client) {
            throw new Error('MongoConnection is not connected');
        }
        return this.client;
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.database = null;
        }
    }
}

