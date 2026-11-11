import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db, ObjectId, WithId } from 'mongodb';
import { Collections, MONGO_DB } from '../../../lib/mongo/mongo.module';
import { PasswordReset } from '../entity/password-reset.entity';

export interface PasswordResetDoc {
    _id?: ObjectId;
    user_id: string;
    email: string;
    otp_hash: string;
    verified_at: Date | null;
    consumed_at: Date | null;
    expires_at: Date;
    created_at: Date;
}

function toEntity(doc: WithId<PasswordResetDoc> | null): PasswordReset | null {
    if (!doc) return null;
    return new PasswordReset({
        id: doc._id.toHexString(),
        userId: doc.user_id,
        email: doc.email,
        otpHash: doc.otp_hash,
        verifiedAt: doc.verified_at,
        consumedAt: doc.consumed_at,
        createdAt: doc.created_at,
        expiresAt: doc.expires_at,
    });
}

@Injectable()
export class PasswordResetRepository {
    private readonly coll: Collection<PasswordResetDoc>;

    constructor(@Inject(MONGO_DB) private readonly db: Db) {
        this.coll = this.db.collection<PasswordResetDoc>(Collections.PasswordResets);
    }

    async createPasswordReset(data: {
        userId: string;
        email: string;
        otpHash: string;
        expiresAt: Date;
        createdAt: Date;
    }): Promise<PasswordReset> {
        const doc: PasswordResetDoc = {
            user_id: data.userId,
            email: data.email.toLowerCase().trim(),
            otp_hash: data.otpHash,
            verified_at: null,
            consumed_at: null,
            expires_at: data.expiresAt,
            created_at: data.createdAt,
        };
        const result = await this.coll.insertOne(doc);
        return toEntity({ ...doc, _id: result.insertedId })!;
    }

    async findLatestPasswordResetByUserId(userId: string): Promise<PasswordReset | null> {
        const doc = await this.coll.findOne(
            {
                user_id: userId,
                consumed_at: null,
            },
            {
                sort: { created_at: -1, _id: -1 },
            }
        );
        return toEntity(doc);
    }

    async updatePasswordResetVerifiedAt(id: string): Promise<void> {
        await this.coll.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    verified_at: new Date(),
                },
            }
        );
    }

    async updatePasswordResetConsumedAt(id: string): Promise<void> {
        await this.coll.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    consumed_at: new Date(),
                },
            }
        );
    }
}

