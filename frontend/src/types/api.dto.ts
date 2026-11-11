export type Language = 'en' | 'ar';
export type ThemeMode = 'system' | 'dark' | 'light';
export type CurrencyCode = 'USD' | 'EGP';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: Record<string, unknown>;
}

// --- User DTOs ---
export interface UserResponseDTO {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    createdAt: string;
}

export interface DeleteUserResponseDTO {
    message: string;
}

// --- Auth Request DTOs ---
export interface RegisterRequestDTO {
    name: string;
    email: string;
    password: string;
}

export interface LoginRequestDTO {
    email: string;
    password: string;
}

export interface ForgotPasswordRequestDTO {
    email: string;
}

export interface VerifyOtpRequestDTO {
    email: string;
    otp: string;
}

export interface ResetPasswordRequestDTO {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}

// --- Auth Response DTOs ---
export interface AuthResponseDTO {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: UserResponseDTO;
}

export interface ForgotPasswordResponseDTO {
    message: string;
    email: string;
    redirectUrl: string;
}

export interface VerifyOtpResponseDTO {
    message: string;
    verified: boolean;
    email: string;
}

export interface ResetPasswordResponseDTO {
    message: string;
}

export interface RefreshTokenResponseDTO {
    message: string;
    accessToken: string;
    refreshToken: string;
}

export interface LogoutResponseDTO {
    message: string;
}

// --- Cooking & History DTOs ---
export interface MatchedPreferencesDTO {
    dietaryRestrictions: string;
    allergies: string;
    cuisine: string;
    groupType: string;
    budget: string;
}

export interface RecipeDTO {
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
    matchedPreferences?: MatchedPreferencesDTO;
}

export interface LocalizedRecipeDTO {
    en: RecipeDTO;
    ar: RecipeDTO;
}

export interface RecommendRequestDTO {
    dietaryRestrictions: string;
    allergies: string;
    cuisine: string;
    groupType: string;
    budget: string;
    currency?: CurrencyCode;
    lang?: Language;
    seenIds?: string[];
}

export interface RecommendResponseDTO {
    type: 'cooking';
    recipe: LocalizedRecipeDTO;
}

export interface CreateHistoryRequestDTO {
    dietaryRestrictions: string;
    allergies: string;
    cuisine: string;
    groupType: string;
    budget: string;
    recommendationName: string;
    recommendationDetails: RecommendResponseDTO;
}

export interface HistoryItemResponseDTO {
    id: string;
    userId: string;
    dietaryRestrictions: string;
    allergies: string;
    cuisine: string;
    actionType: 'cooking';
    groupType: string;
    budget: string;
    recommendationName: string;
    recommendationDetails: RecommendResponseDTO;
    createdAt: string;
}

export interface HistoryListResponseDTO {
    items: HistoryItemResponseDTO[];
}

export interface DeleteHistoryResponseDTO {
    message: string;
    id: string;
}
