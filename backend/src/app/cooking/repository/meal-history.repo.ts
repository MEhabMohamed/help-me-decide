import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db, ObjectId, WithId } from 'mongodb';
import { Collections, MONGO_DB } from '../../../lib/mongo/mongo.module';
import { MealHistory, RecommendationPayload } from '../entity/meal-history.entity';

export interface MealHistoryDoc {
    _id?: ObjectId;
    user_id: string;
    dietary_restrictions: string;
    allergies: string;
    cuisine: string;
    action_type: 'cooking';
    group_type: string;
    budget: string;
    recommendation_name: string;
    recommendation_details: RecommendationPayload;
    created_at: Date;
}

function toEntity(doc: WithId<MealHistoryDoc> | null): MealHistory | null {
    if (!doc) return null;
    return new MealHistory({
        id: doc._id.toHexString(),
        userId: doc.user_id,
        dietaryRestrictions: doc.dietary_restrictions,
        allergies: doc.allergies,
        cuisine: doc.cuisine,
        actionType: 'cooking',
        groupType: doc.group_type,
        budget: doc.budget,
        recommendationName: doc.recommendation_name,
        recommendationDetails: doc.recommendation_details,
        createdAt: doc.created_at,
    });
}

@Injectable()
export class MealHistoryRepository {
    private readonly coll: Collection<MealHistoryDoc>;

    constructor(@Inject(MONGO_DB) private readonly db: Db) {
        this.coll = this.db.collection<MealHistoryDoc>(Collections.MealHistory);
    }

    async create(data: {
        userId: string;
        dietaryRestrictions: string;
        allergies: string;
        cuisine: string;
        groupType: string;
        budget: string;
        recommendationName: string;
        recommendationDetails: RecommendationPayload;
    }): Promise<MealHistory> {
        const doc: MealHistoryDoc = {
            user_id: data.userId,
            dietary_restrictions: data.dietaryRestrictions,
            allergies: data.allergies,
            cuisine: data.cuisine,
            action_type: 'cooking',
            group_type: data.groupType,
            budget: data.budget,
            recommendation_name: data.recommendationName,
            recommendation_details: data.recommendationDetails,
            created_at: new Date(),
        };
        const result = await this.coll.insertOne(doc);
        return toEntity({ ...doc, _id: result.insertedId })!;
    }

    async findByUserId(userId: string): Promise<MealHistory[]> {
        const docs = await this.coll
            .find({ user_id: userId })
            .sort({ created_at: -1, _id: -1 })
            .toArray();
        return docs.map((d) => toEntity(d)!);
    }

    async findRecentNamesByUserId(userId: string, limit = 15): Promise<string[]> {
        const docs = await this.coll
            .find({ user_id: userId }, { projection: { recommendation_name: 1 } })
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();
        return docs.map((d) => (d.recommendation_name || '').toLowerCase());
    }

    async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
        if (!ObjectId.isValid(id)) return false;
        const result = await this.coll.deleteOne({
            _id: new ObjectId(id),
            user_id: userId,
        });
        return result.deletedCount > 0;
    }
}

