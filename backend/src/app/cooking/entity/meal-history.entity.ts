export type CurrencyCode = 'USD' | 'EGP';

export interface RecipeDetails {
    id: string;
    name: string;
    category: string;
    area: string;
    instructions: string;
    image: string;
    youtube: string;
    ingredients: string[];
    measurements: string[];
    estimatedCost?: string;
    estimatedCostUsd?: string;
    estimatedCostEgp?: string;
    matchedPreferences?: {
        dietaryRestrictions: string;
        allergies: string;
        cuisine: string;
        groupType: string;
        budget: string;
        currency: CurrencyCode;
    };
}

export interface LocalizedRecipePayload {
    en: RecipeDetails;
    ar: RecipeDetails;
}

export interface RecommendationPayload {
    type: 'cooking';
    recipe: LocalizedRecipePayload;
}

export class MealHistory {
    id: string;
    userId: string;
    dietaryRestrictions: string;
    allergies: string;
    cuisine: string;
    actionType: 'cooking';
    groupType: string;
    budget: string;
    recommendationName: string;
    recommendationDetails: RecommendationPayload;
    createdAt: Date;

    constructor(data: Partial<MealHistory>) {
        this.id = data.id!;
        this.userId = data.userId!;
        this.dietaryRestrictions = data.dietaryRestrictions ?? 'None';
        this.allergies = data.allergies ?? 'None';
        this.cuisine = data.cuisine ?? 'Any';
        this.actionType = 'cooking';
        this.groupType = data.groupType ?? 'Solo';
        this.budget = data.budget ?? '20 USD';
        this.recommendationName = data.recommendationName!;
        this.recommendationDetails = data.recommendationDetails!;
        this.createdAt = data.createdAt ?? new Date();
    }
}
