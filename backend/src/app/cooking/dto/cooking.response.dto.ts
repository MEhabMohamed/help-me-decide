import {
    CurrencyCode,
    LocalizedRecipePayload,
    MealHistory,
    RecipeDetails,
    RecommendationPayload,
} from '../entity/meal-history.entity';

export class RecipeResponseDTO implements RecipeDetails {
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

    constructor(recipe: RecipeDetails) {
        this.id = recipe.id;
        this.name = recipe.name;
        this.category = recipe.category;
        this.area = recipe.area;
        this.instructions = recipe.instructions;
        this.image = recipe.image;
        this.youtube = recipe.youtube;
        this.ingredients = recipe.ingredients;
        this.measurements = recipe.measurements;
        this.estimatedCost = recipe.estimatedCost;
        this.estimatedCostUsd = recipe.estimatedCostUsd;
        this.estimatedCostEgp = recipe.estimatedCostEgp;
        this.matchedPreferences = recipe.matchedPreferences;
    }
}

export class RecommendResponseDTO {
    type: 'cooking';
    recipe: LocalizedRecipePayload;

    constructor(en: RecipeDetails, ar: RecipeDetails) {
        this.type = 'cooking';
        this.recipe = {
            en: new RecipeResponseDTO(en),
            ar: new RecipeResponseDTO(ar),
        };
    }
}

export class HistoryItemResponseDTO {
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

    constructor(entity: MealHistory) {
        this.id = entity.id;
        this.userId = entity.userId;
        this.dietaryRestrictions = entity.dietaryRestrictions;
        this.allergies = entity.allergies;
        this.cuisine = entity.cuisine;
        this.actionType = 'cooking';
        this.groupType = entity.groupType;
        this.budget = entity.budget;
        this.recommendationName = entity.recommendationName;
        this.recommendationDetails = entity.recommendationDetails;
        this.createdAt = entity.createdAt;
    }
}

export class HistoryListResponseDTO {
    items: HistoryItemResponseDTO[];

    constructor(entities: MealHistory[]) {
        this.items = entities.map((e) => new HistoryItemResponseDTO(e));
    }
}

export class DeleteHistoryResponseDTO {
    message: string;
    id: string;

    constructor(message: string, id: string) {
        this.message = message;
        this.id = id;
    }
}
