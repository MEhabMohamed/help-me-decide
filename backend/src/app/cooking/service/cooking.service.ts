import { Inject, Injectable } from '@nestjs/common';
import { MealHistoryRepository } from '../repository/meal-history.repo';
import { CreateHistoryRequestDTO, RecommendRequestDTO } from '../dto/cooking.request.dto';
import {
    DeleteHistoryResponseDTO,
    HistoryItemResponseDTO,
    HistoryListResponseDTO,
    RecommendResponseDTO,
} from '../dto/cooking.response.dto';
import { CurrencyCode, RecipeDetails } from '../entity/meal-history.entity';
import { AppError } from '../../../lib/error/AppError';

const BOYCOTT_BRANDS = [
    'mcdonald',
    'starbucks',
    'kfc',
    'kentucky fried',
    'burger king',
    'pizza hut',
    'subway',
    'domino',
    'dunkin',
    'popeye',
    'wendy',
    'hardee',
    'baskin robbins',
    'papa john',
    'taco bell',
    'tacobell',
    'krispy kreme',
    'nestle',
    'nestlé',
    'coca-cola',
    'coca cola',
    'coke',
    'pepsi',
    'costa coffee',
    'wimpy',
    'pizza express',
    'marks & spencer',
    'm&s',
    'burgerking',
    'cadbury',
    'oreo',
    'kraft',
    'danone',
    'kellogg',
    'maggi',
    'knorr',
    'unilever',
    'kitkat',
    'kit kat',
    'milkybar',
    'milky bar',
    'nescafe',
    'nescafé',
    'perrier',
    'vittel',
    'san pellegrino',
    'cheerios',
    'smarties',
    'milos',
    'milo',
];

const HARAM_INGREDIENTS = [
    'pork',
    'bacon',
    'prosciutto',
    'pancetta',
    'chorizo',
    'lardons',
    'lardon',
    'pork belly',
    'pork chops',
    'pork loin',
    'pork ribs',
    'pork shoulder',
    'jamon',
    'jamón',
    'cerdo',
    'porc',
    'maiale',
    'kabanos',
    'gelatin',
    'wine',
    'red wine',
    'white wine',
    'cooking wine',
    'rice wine',
    'mirin',
    'sherry',
    'marsala',
    'port wine',
    'champagne',
    'beer',
    'ale',
    'lager',
    'stout',
    'rum',
    'bourbon',
    'whiskey',
    'whisky',
    'vodka',
    'tequila',
    'brandy',
    'cognac',
    'liqueur',
    'liquor',
    'alcohol',
    'sake',
];

const CUISINE_AREA_MAP: Record<string, string[]> = {
    indian: ['Indian'],
    american: ['American'],
    french: ['French'],
    dutch: ['Dutch'],
    norwegian: ['Norwegian'],
    egyptian: ['Egyptian'],
    italian: ['Italian'],
    mexican: ['Mexican'],
    chinese: ['Chinese'],
    japanese: ['Japanese'],
    mediterranean: ['Greek', 'Tunisian', 'Turkish', 'Moroccan', 'Egyptian', 'Italian', 'Spanish'],
    greek: ['Greek'],
    turkish: ['Turkish'],
    moroccan: ['Moroccan'],
    tunisian: ['Tunisian'],
    syrian: ['Syrian'],
    lebanese: ['Lebanese'],
    saudi: ['Saudi'],
    algerian: ['Algerian'],
    arabian: ['Egyptian', 'Tunisian', 'Moroccan', 'Saudi', 'Algerian'],
    british: ['British'],
    thai: ['Thai'],
    vietnamese: ['Vietnamese'],
    spanish: ['Spanish'],
    canadian: ['Canadian'],
    irish: ['Irish'],
    jamaican: ['Jamaican'],
    polish: ['Polish'],
    portuguese: ['Portuguese'],
    malaysian: ['Malaysian'],
    russian: ['Russian'],
    filipino: ['Filipino'],
    croatian: ['Croatian'],
};

function isBoycotted(text: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return BOYCOTT_BRANDS.some((brand) => lower.includes(brand));
}

function isHaramRecipe(text: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    for (const item of HARAM_INGREDIENTS) {
        if (item === 'wine') {
            if (/\bwine\b/i.test(lower) && !/\bwine\s+vinegar\b/i.test(lower)) return true;
        } else if (item === 'rum') {
            if (/\brum\b/i.test(lower)) return true;
        } else if (item === 'beer') {
            if (/\bbeer\b/i.test(lower)) return true;
        } else {
            if (lower.includes(item)) return true;
        }
    }
    if (/\bham\b/i.test(lower)) return true;
    if (/\blard\b/i.test(lower)) return true;
    if (lower.includes('cider') && !lower.includes('cider vinegar')) return true;
    return false;
}

export async function translateText(text: string, targetLang = 'ar'): Promise<string> {
    if (!text || !text.trim()) return text;
    try {
        const url = 'https://translate.googleapis.com/translate_a/single';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            body: new URLSearchParams({
                client: 'gtx',
                sl: 'auto',
                tl: targetLang,
                dt: 't',
                q: text,
            }),
        });
        if (!response.ok) return text;
        const data = (await response.json()) as unknown[][][];
        if (data && data[0]) {
            return data[0]
                .map((item) => (item && item[0] ? String(item[0]) : ''))
                .join('');
        }
        return text;
    } catch {
        return text;
    }
}

export async function translateArray(arr: string[], targetLang = 'ar'): Promise<string[]> {
    if (!arr || arr.length === 0) return arr;
    try {
        const joined = arr.join('\n');
        const translated = await translateText(joined, targetLang);
        const split = translated.split('\n').map((item) => item.trim());
        if (split.length === arr.length) {
            return split;
        }
        return await Promise.all(arr.map((item) => translateText(item, targetLang)));
    } catch {
        return arr;
    }
}

function getRecipeCostCategory(
    meal: Record<string, string>,
    ingredients: string[]
): { tier: 'low' | 'medium' | 'high'; estimatedUsdSolo: number; estimatedEgpSolo: number } {
    const name = (meal.strMeal || '').toLowerCase();
    const premiumKeywords = [
        'beef',
        'steak',
        'lamb',
        'mutton',
        'salmon',
        'tuna',
        'shrimp',
        'prawn',
        'seafood',
        'lobster',
        'duck',
        'veal',
    ];
    const midKeywords = ['chicken', 'turkey', 'fish', 'cod', 'haddock', 'prawns'];

    const textToSearch = `${name} ${meal.strInstructions || ''} ${ingredients.join(' ')}`.toLowerCase();

    const hasPremium = premiumKeywords.some((w) => textToSearch.includes(w));
    const hasMid = midKeywords.some((w) => textToSearch.includes(w));

    if (hasPremium) return { tier: 'high', estimatedUsdSolo: 28, estimatedEgpSolo: 320 };
    if (hasMid) return { tier: 'medium', estimatedUsdSolo: 18, estimatedEgpSolo: 180 };
    return { tier: 'low', estimatedUsdSolo: 10, estimatedEgpSolo: 95 };
}

function shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

interface MealDbSummary {
    idMeal: string;
    strMeal: string;
    strMealThumb?: string;
}

@Injectable()
export class CookingService {
    constructor(@Inject(MealHistoryRepository) private readonly historyRepo: MealHistoryRepository) { }

    private async buildLocalizedResponse(detailEn: RecipeDetails): Promise<RecommendResponseDTO> {
        const [nameAr, categoryAr, areaAr, instructionsAr, ingredientsAr, measurementsAr] =
            await Promise.all([
                translateText(detailEn.name, 'ar'),
                translateText(detailEn.category, 'ar'),
                translateText(detailEn.area, 'ar'),
                translateText(detailEn.instructions, 'ar'),
                translateArray(detailEn.ingredients, 'ar'),
                translateArray(detailEn.measurements, 'ar'),
            ]);

        const detailAr: RecipeDetails = {
            ...detailEn,
            name: nameAr,
            category: categoryAr,
            area: areaAr,
            instructions: instructionsAr,
            ingredients: ingredientsAr,
            measurements: measurementsAr,
        };

        return new RecommendResponseDTO(detailEn, detailAr);
    }

    private async getRecipeDetailsAndVerify(
        idMeal: string,
        params: {
            dietaryRestrictions: string;
            allergies: string;
            cuisine: string;
            groupType: string;
            budget: string;
            currency: CurrencyCode;
        },
        enforceBudget: boolean
    ): Promise<RecipeDetails | null> {
        const safeDietary = params.dietaryRestrictions || 'None';
        const safeAllergies = params.allergies || 'None';
        const safeCuisine = params.cuisine || 'Any';
        const safeGroupType = params.groupType || 'Solo';
        const safeBudget = params.budget || '20 USD';
        const safeCurrency: CurrencyCode =
            params.currency || (safeBudget.toUpperCase().includes('EGP') ? 'EGP' : 'USD');

        const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(idMeal)}`;
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = (await response.json()) as { meals: Record<string, string>[] | null };
        if (!data.meals || data.meals.length === 0) return null;

        const meal = data.meals[0];

        const ingredients: string[] = [];
        const measurements: string[] = [];
        let boycottFound = false;
        let haramFound = false;

        for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            const meas = meal[`strMeasure${i}`];
            if (ing && ing.trim()) {
                const trimmedIng = ing.trim();
                ingredients.push(trimmedIng);
                measurements.push(meas ? meas.trim() : '');
                if (isBoycotted(trimmedIng)) boycottFound = true;
                if (isHaramRecipe(trimmedIng)) haramFound = true;
            }
        }

        if (
            boycottFound ||
            haramFound ||
            isBoycotted(meal.strMeal) ||
            isHaramRecipe(meal.strMeal) ||
            isBoycotted(meal.strCategory) ||
            isHaramRecipe(meal.strCategory) ||
            isBoycotted(meal.strInstructions) ||
            isHaramRecipe(meal.strInstructions)
        ) {
            return null;
        }

        const lowerDiet = safeDietary.toLowerCase().trim();
        const ingredientsLower = ingredients.join(' ').toLowerCase();
        const textToSearch = `${meal.strMeal} ${meal.strCategory || ''} ${meal.strInstructions || ''} ${ingredientsLower}`.toLowerCase();

        // 1. Strict Dietary Restrictions check
        const meatAndFishWords = [
            'beef',
            'chicken',
            'pork',
            'lamb',
            'mutton',
            'bacon',
            'ham',
            'steak',
            'meat',
            'shrimp',
            'prawn',
            'crab',
            'lobster',
            'fish',
            'anchovies',
            'anchovy',
            'tuna',
            'salmon',
            'duck',
            'turkey',
            'veal',
            'sausage',
            'mince',
            'sardine',
            'cod',
            'haddock',
        ];

        const dairyAndAnimalWords = [
            'milk',
            'cheese',
            'egg',
            'eggs',
            'butter',
            'cream',
            'yogurt',
            'yoghurt',
            'honey',
            'dairy',
            'mayonnaise',
            'ghee',
            'parmesan',
            'mozzarella',
            'cheddar',
            'paneer',
            'ricotta',
            'mascarpone',
        ];

        if (lowerDiet.includes('vegetarian') || lowerDiet.includes('vegan')) {
            if (meatAndFishWords.some((word) => textToSearch.includes(word))) {
                return null;
            }
            if (lowerDiet.includes('vegan')) {
                if (dairyAndAnimalWords.some((word) => textToSearch.includes(word))) {
                    return null;
                }
            }
        } else if (lowerDiet.includes('kosher')) {
            const nonKosherWords = [
                'pork',
                'bacon',
                'ham',
                'prosciutto',
                'pancetta',
                'lard',
                'shrimp',
                'prawn',
                'crab',
                'lobster',
                'clam',
                'mussel',
                'oyster',
                'squid',
                'calamari',
                'octopus',
                'scallop',
                'shellfish',
            ];
            if (nonKosherWords.some((w) => textToSearch.includes(w))) {
                return null;
            }
            const kosherMeatWords = [
                'beef',
                'chicken',
                'lamb',
                'mutton',
                'steak',
                'meat',
                'turkey',
                'veal',
                'duck',
                'mince',
                'brisket',
            ];
            const kosherDairyWords = [
                'milk',
                'cheese',
                'butter',
                'cream',
                'yogurt',
                'yoghurt',
                'parmesan',
                'mozzarella',
                'cheddar',
                'ghee',
                'paneer',
                'ricotta',
                'mascarpone',
                'sour cream',
            ];
            const hasMeat = kosherMeatWords.some(
                (w) => ingredientsLower.includes(w) || meal.strMeal.toLowerCase().includes(w)
            );
            const hasDairy = kosherDairyWords.some((w) => {
                if (w === 'milk' || w === 'cream' || w === 'butter') {
                    const regex = new RegExp(
                        `(?<!coconut\\s)(?<!peanut\\s)(?<!almond\\s)\\b${w}\\b`,
                        'i'
                    );
                    return regex.test(ingredientsLower);
                }
                return ingredientsLower.includes(w);
            });
            if (hasMeat && hasDairy) {
                return null;
            }
        } else if (lowerDiet !== 'none' && lowerDiet !== '') {
            const customCleaned = lowerDiet
                .replace(/\b(no|without|avoid|free|diet|low)\b/gi, '')
                .trim();
            if (customCleaned && customCleaned.length >= 3) {
                if (textToSearch.includes(customCleaned)) {
                    return null;
                }
            }
        }

        // 2. Strict Allergies check
        if (safeAllergies && safeAllergies.trim().toLowerCase() !== 'none') {
            const allergyList = safeAllergies
                .split(',')
                .map((a) => a.trim().toLowerCase())
                .filter(Boolean);

            for (const allergy of allergyList) {
                if (allergy === 'none') continue;
                if (allergy.includes('gluten')) {
                    const glutenKeywords = [
                        'wheat',
                        'flour',
                        'bread',
                        'pasta',
                        'spaghetti',
                        'macaroni',
                        'noodles',
                        'lasagne',
                        'semolina',
                        'barley',
                        'rye',
                        'couscous',
                        'breadcrumbs',
                        'tortilla',
                        'pastry',
                        'biscuit',
                        'soy sauce',
                    ];
                    if (glutenKeywords.some((kw) => textToSearch.includes(kw))) return null;
                } else if (allergy.includes('seafood') || allergy.includes('fish')) {
                    const seafoodKeywords = [
                        'fish',
                        'shrimp',
                        'prawn',
                        'crab',
                        'lobster',
                        'clam',
                        'mussel',
                        'oyster',
                        'scallop',
                        'tuna',
                        'salmon',
                        'anchovy',
                        'anchovies',
                        'cod',
                        'haddock',
                        'sardine',
                        'mackerel',
                        'squid',
                        'calamari',
                        'seafood',
                    ];
                    if (seafoodKeywords.some((kw) => textToSearch.includes(kw))) return null;
                } else if (allergy.includes('nut') || allergy.includes('peanut')) {
                    const nutKeywords = [
                        'peanut',
                        'walnut',
                        'almond',
                        'cashew',
                        'pecan',
                        'hazelnut',
                        'pistachio',
                        'macadamia',
                        'pine nut',
                        'nuts',
                    ];
                    if (nutKeywords.some((kw) => textToSearch.includes(kw))) return null;
                } else if (
                    allergy.includes('dairy') ||
                    allergy.includes('milk') ||
                    allergy.includes('lactose')
                ) {
                    const dairyKeywords = [
                        'milk',
                        'butter',
                        'cheese',
                        'cream',
                        'yogurt',
                        'yoghurt',
                        'dairy',
                        'ghee',
                        'parmesan',
                        'mozzarella',
                        'cheddar',
                        'paneer',
                        'ricotta',
                        'mascarpone',
                    ];
                    if (
                        dairyKeywords.some((kw) => {
                            if (kw === 'milk' || kw === 'cream' || kw === 'butter') {
                                const regex = new RegExp(
                                    `(?<!coconut\\s)(?<!peanut\\s)(?<!almond\\s)\\b${kw}\\b`,
                                    'i'
                                );
                                return regex.test(textToSearch);
                            }
                            return textToSearch.includes(kw);
                        })
                    ) {
                        return null;
                    }
                } else {
                    const cleanedAllergy = allergy
                        .replace(/\b(allergy|allergic|to|no)\b/gi, '')
                        .trim();
                    if (cleanedAllergy.length >= 2 && textToSearch.includes(cleanedAllergy)) {
                        return null;
                    }
                }
            }
        }

        // 3. Budget Tier Check (Supports both USD and EGP)
        const costInfo = getRecipeCostCategory(meal, ingredients);
        const isGroup = safeGroupType.toLowerCase() === 'group';
        const multiplier = isGroup ? 2.5 : 1;

        const estimatedTotalUsd = Math.round(costInfo.estimatedUsdSolo * multiplier);
        const estimatedTotalEgp = Math.round(costInfo.estimatedEgpSolo * multiplier);
        const budgetNum =
            parseFloat(safeBudget.replace(/[^0-9.]/g, '')) ||
            (safeCurrency === 'EGP' ? 150 : 20);

        if (enforceBudget) {
            if (safeCurrency === 'EGP') {
                const effectiveEgpPerSolo = isGroup ? Math.max(budgetNum / 2, 100) : budgetNum;
                if (effectiveEgpPerSolo < 120 && costInfo.tier === 'high') {
                    return null;
                }
                if (effectiveEgpPerSolo > 250 && costInfo.tier === 'low') {
                    return null;
                }
            } else {
                const effectiveUsdPerSolo = isGroup ? Math.max(budgetNum / 2, 12) : budgetNum;
                if (effectiveUsdPerSolo < 15 && costInfo.tier === 'high') {
                    return null;
                }
                if (effectiveUsdPerSolo >= 35 && costInfo.tier === 'low') {
                    return null;
                }
            }
        }

        const formattedUsd = `${Math.min(
            estimatedTotalUsd,
            safeCurrency === 'USD' ? Math.round(budgetNum) : estimatedTotalUsd
        )} USD`;
        const formattedEgp = `${Math.min(
            estimatedTotalEgp,
            safeCurrency === 'EGP' ? Math.round(budgetNum) : estimatedTotalEgp
        )} EGP`;

        return {
            id: meal.idMeal,
            name: meal.strMeal,
            category: meal.strCategory,
            area: meal.strArea || safeCuisine,
            instructions: meal.strInstructions,
            image: meal.strMealThumb,
            youtube: meal.strYoutube || '',
            ingredients,
            measurements,
            estimatedCost: safeCurrency === 'EGP' ? formattedEgp : formattedUsd,
            estimatedCostUsd: formattedUsd,
            estimatedCostEgp: formattedEgp,
            matchedPreferences: {
                dietaryRestrictions: safeDietary,
                allergies: safeAllergies,
                cuisine: meal.strArea || safeCuisine,
                groupType: safeGroupType,
                budget: `${Math.round(budgetNum)} ${safeCurrency}`,
                currency: safeCurrency,
            },
        };
    }

    recommend = async (
        userId: string,
        data: RecommendRequestDTO
    ): Promise<RecommendResponseDTO> => {
        const excludedNames = await this.historyRepo.findRecentNamesByUserId(userId, 15);
        const seenIds = data.seenIds || [];
        const resolvedCurrency: CurrencyCode =
            data.currency || (data.budget.toUpperCase().includes('EGP') ? 'EGP' : 'USD');

        // Translate Arabic custom inputs back to English if needed
        let resolvedCuisine = data.cuisine || 'Any';
        if (/[\u0600-\u06FF]/.test(resolvedCuisine)) {
            const translated = await translateText(resolvedCuisine, 'en');
            if (translated && translated.trim()) {
                resolvedCuisine = translated.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
            }
        }

        let resolvedDietary = data.dietaryRestrictions || 'None';
        if (/[\u0600-\u06FF]/.test(resolvedDietary)) {
            const translated = await translateText(resolvedDietary, 'en');
            if (translated && translated.trim()) {
                resolvedDietary = translated.trim();
            }
        }

        let resolvedAllergies = data.allergies || 'None';
        if (/[\u0600-\u06FF]/.test(resolvedAllergies)) {
            const translated = await translateText(resolvedAllergies, 'en');
            if (translated && translated.trim()) {
                resolvedAllergies = translated.trim();
            }
        }

        resolvedCuisine =
            resolvedCuisine
                .replace(/\b(cuisine|kitchen|food|dishes|style|cooking|restaurant|مطبخ|أكل)\b/gi, '')
                .trim() || 'Any';
        if (resolvedCuisine.toLowerCase() === 'hindi' || resolvedCuisine.toLowerCase() === 'india') {
            resolvedCuisine = 'Indian';
        }

        const normalizedParams = {
            dietaryRestrictions: resolvedDietary,
            allergies: resolvedAllergies,
            cuisine: resolvedCuisine,
            groupType: data.groupType,
            budget: data.budget,
            currency: resolvedCurrency,
        };

        const lowerCuisine = resolvedCuisine.toLowerCase();
        const isAnyCuisine =
            !resolvedCuisine ||
            lowerCuisine === 'any' ||
            lowerCuisine === 'none' ||
            lowerCuisine === 'all';

        const lowerDiet = resolvedDietary.toLowerCase();
        let mealCandidates: MealDbSummary[] = [];

        if (!isAnyCuisine) {
            const areas = CUISINE_AREA_MAP[lowerCuisine] || [
                resolvedCuisine.charAt(0).toUpperCase() + resolvedCuisine.slice(1),
            ];
            for (const area of areas) {
                try {
                    const resp = await fetch(
                        `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(area)}`
                    );
                    if (resp.ok) {
                        const body = (await resp.json()) as { meals: MealDbSummary[] | null };
                        if (body.meals && body.meals.length > 0) {
                            for (const m of body.meals) {
                                if (!mealCandidates.some((ex) => ex.idMeal === m.idMeal)) {
                                    mealCandidates.push(m);
                                }
                            }
                        }
                    }
                } catch {
                    // ignore
                }
            }

            if (mealCandidates.length === 0) {
                try {
                    const resp = await fetch(
                        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(resolvedCuisine)}`
                    );
                    if (resp.ok) {
                        const body = (await resp.json()) as { meals: MealDbSummary[] | null };
                        if (body.meals && body.meals.length > 0) {
                            mealCandidates = body.meals;
                        }
                    }
                } catch {
                    // ignore
                }
            }

            if (mealCandidates.length === 0 && lowerCuisine === 'indian') {
                try {
                    const resp = await fetch(
                        'https://www.themealdb.com/api/json/v1/1/search.php?s=curry'
                    );
                    if (resp.ok) {
                        const body = (await resp.json()) as { meals: MealDbSummary[] | null };
                        if (body.meals && body.meals.length > 0) {
                            mealCandidates = body.meals;
                        }
                    }
                } catch {
                    // ignore
                }
            }
        } else {
            const categoriesToFetch: string[] = [];
            if (lowerDiet.includes('vegan')) {
                categoriesToFetch.push('Vegan', 'Vegetarian', 'Side');
            } else if (lowerDiet.includes('vegetarian')) {
                categoriesToFetch.push('Vegetarian', 'Vegan', 'Pasta', 'Side');
            } else if (lowerDiet.includes('kosher')) {
                categoriesToFetch.push('Chicken', 'Beef', 'Lamb', 'Vegetarian', 'Side');
            } else {
                categoriesToFetch.push('Chicken', 'Beef', 'Seafood', 'Vegetarian', 'Pasta', 'Lamb');
            }

            for (const cat of shuffleArray(categoriesToFetch).slice(0, 3)) {
                try {
                    const resp = await fetch(
                        `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`
                    );
                    if (resp.ok) {
                        const body = (await resp.json()) as { meals: MealDbSummary[] | null };
                        if (body.meals && body.meals.length > 0) {
                            for (const m of body.meals) {
                                if (!mealCandidates.some((ex) => ex.idMeal === m.idMeal)) {
                                    mealCandidates.push(m);
                                }
                            }
                        }
                    }
                } catch {
                    // ignore
                }
            }
        }

        if (mealCandidates.length > 0) {
            mealCandidates = shuffleArray(mealCandidates);
            const pool = mealCandidates.slice(0, 35);

            // Pass 1: Strict budget, history, and all dietary/allergy/cuisine rules
            for (const m of pool) {
                const isSeen = seenIds.includes(m.idMeal) || seenIds.includes(m.strMeal);
                const isHistory = excludedNames.includes(m.strMeal.toLowerCase());
                if (isSeen || isHistory) continue;

                const detail = await this.getRecipeDetailsAndVerify(
                    m.idMeal,
                    normalizedParams,
                    true
                );
                if (detail) {
                    return await this.buildLocalizedResponse(detail);
                }
            }

            // Pass 2: Relax budget tier slightly while strictly enforcing dietary, allergy, cuisine, Halal & boycott rules
            for (const m of pool) {
                const isSeen = seenIds.includes(m.idMeal) || seenIds.includes(m.strMeal);
                const isHistory = excludedNames.includes(m.strMeal.toLowerCase());
                if (isSeen || isHistory) continue;

                const detail = await this.getRecipeDetailsAndVerify(
                    m.idMeal,
                    normalizedParams,
                    false
                );
                if (detail) {
                    return await this.buildLocalizedResponse(detail);
                }
            }

            // Pass 3: Allow previously seen recipes if all matching ones in this cuisine were already seen
            for (const m of pool) {
                const detail = await this.getRecipeDetailsAndVerify(
                    m.idMeal,
                    normalizedParams,
                    false
                );
                if (detail) {
                    return await this.buildLocalizedResponse(detail);
                }
            }
        }

        const errMsg =
            data.lang === 'ar'
                ? `لم نجد أي وصفات طهي تناسب جميع اختياراتك للمطبخ: ${data.cuisine}. جرب تخفيف القيود قليلاً.`
                : `Could not find a suitable recipe matching all your selected preferences (Dietary: ${data.dietaryRestrictions}, Allergies: ${data.allergies}, Cuisine: ${resolvedCuisine}). Please try adjusting one of your filters.`;

        throw new AppError(errMsg, 404);
    };

    saveHistory = async (
        userId: string,
        data: CreateHistoryRequestDTO
    ): Promise<HistoryItemResponseDTO> => {
        const created = await this.historyRepo.create({
            userId,
            dietaryRestrictions: data.dietaryRestrictions,
            allergies: data.allergies,
            cuisine: data.cuisine,
            groupType: data.groupType,
            budget: data.budget,
            recommendationName: data.recommendationName,
            recommendationDetails: data.recommendationDetails,
        });
        return new HistoryItemResponseDTO(created);
    };

    getHistory = async (userId: string): Promise<HistoryListResponseDTO> => {
        const list = await this.historyRepo.findByUserId(userId);
        return new HistoryListResponseDTO(list);
    };

    deleteHistoryItem = async (
        userId: string,
        historyId: string
    ): Promise<DeleteHistoryResponseDTO> => {
        const deleted = await this.historyRepo.deleteByIdAndUserId(historyId, userId);
        if (!deleted) {
            throw new AppError('History record not found or unauthorized', 404);
        }
        return new DeleteHistoryResponseDTO('History record deleted successfully', historyId);
    };
}
