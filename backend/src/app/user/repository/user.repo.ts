import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db, ObjectId, WithId } from 'mongodb';
import { Collections, MONGO_DB } from '../../../pkg/mongo/mongo.module';
import { User } from '../entity/user.entity';

export interface UserDoc {
    _id?: ObjectId;
    email: string;
    name: string;
    password_hash: string | null;
    google_id: string | null;
    avatar_url: string | null;
    created_at: Date;
    updated_at: Date;
}

function toEntity(doc: WithId<UserDoc> | null): User | null {
    if (!doc) return null;
    return new User({
        id: doc._id.toHexString(),
        email: doc.email,
        name: doc.name,
        passwordHash: doc.password_hash,
        googleId: doc.google_id,
        avatarUrl: doc.avatar_url,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
    });
}

@Injectable()
export class UserRepository {
    private readonly coll: Collection<UserDoc>;

    constructor(@Inject(MONGO_DB) private readonly db: Db) {
        this.coll = this.db.collection<UserDoc>(Collections.Users);
    }

    async createUser(data: {
        email: string;
        name: string;
        passwordHash?: string | null;
        googleId?: string | null;
        avatarUrl?: string | null;
    }): Promise<User> {
        const now = new Date();
        const doc: UserDoc = {
            email: data.email.toLowerCase().trim(),
            name: data.name.trim(),
            password_hash: data.passwordHash ?? null,
            google_id: data.googleId ?? null,
            avatar_url: data.avatarUrl ?? null,
            created_at: now,
            updated_at: now,
        };
        const result = await this.coll.insertOne(doc);
        return toEntity({ ...doc, _id: result.insertedId })!;
    }

    async findUserByEmail(email: string): Promise<User | null> {
        const doc = await this.coll.findOne({ email: email.toLowerCase().trim() });
        return toEntity(doc);
    }

    async findUserByGoogleIdOrEmail(googleId: string, email: string): Promise<User | null> {
        const doc = await this.coll.findOne({
            $or: [{ google_id: googleId }, { email: email.toLowerCase().trim() }],
        });
        return toEntity(doc);
    }

    async findUserById(id: string): Promise<User | null> {
        if (!ObjectId.isValid(id)) return null;
        const doc = await this.coll.findOne({ _id: new ObjectId(id) });
        return toEntity(doc);
    }

    async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
        await this.coll.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    password_hash: passwordHash,
                    updated_at: new Date(),
                },
            }
        );
    }

    async updateGoogleProfile(
        userId: string,
        data: { googleId: string; name?: string; avatarUrl?: string | null }
    ): Promise<User | null> {
        const setFields: Partial<UserDoc> = {
            google_id: data.googleId,
            updated_at: new Date(),
        };
        if (data.name) setFields.name = data.name;
        if (data.avatarUrl !== undefined) setFields.avatar_url = data.avatarUrl;

        await this.coll.updateOne({ _id: new ObjectId(userId) }, { $set: setFields });
        return this.findUserById(userId);
    }

    async updateUserProfile(
        userId: string,
        data: { name: string; avatarUrl?: string }
    ): Promise<User | null> {
        const setFields: Partial<UserDoc> = {
            name: data.name.trim(),
            updated_at: new Date(),
        };
        if (data.avatarUrl !== undefined) {
            setFields.avatar_url = data.avatarUrl;
        }
        await this.coll.updateOne({ _id: new ObjectId(userId) }, { $set: setFields });
        return this.findUserById(userId);
    }

    async deleteUserById(userId: string): Promise<boolean> {
        if (!ObjectId.isValid(userId)) return false;
        const res = await this.coll.deleteOne({ _id: new ObjectId(userId) });
        if (res.deletedCount > 0) {
            // Cascade delete user's meal history & password resets
            await this.db.collection(Collections.MealHistory).deleteMany({ user_id: userId });
            await this.db.collection(Collections.PasswordResets).deleteMany({ user_id: userId });
            return true;
        }
        return false;
    }
}

