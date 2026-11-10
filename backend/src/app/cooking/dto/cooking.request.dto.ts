import {
    IsArray,
    IsIn,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';
import { CurrencyCode, RecommendationPayload } from '../entity/meal-history.entity';

export class RecommendRequestDTO {
    @IsString()
    @IsNotEmpty({ message: 'dietaryRestrictions is required' })
    dietaryRestrictions!: string;

    @IsString()
    @IsNotEmpty({ message: 'allergies is required' })
    allergies!: string;

    @IsString()
    @IsNotEmpty({ message: 'cuisine is required' })
    cuisine!: string;

    @IsString()
    @IsNotEmpty({ message: 'groupType is required' })
    groupType!: string;

    @IsString()
    @IsNotEmpty({ message: 'budget is required' })
    budget!: string;

    @IsOptional()
    @IsString()
    @IsIn(['USD', 'EGP'])
    currency?: CurrencyCode;

    @IsOptional()
    @IsString()
    @IsIn(['en', 'ar'])
    lang?: 'en' | 'ar';

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    seenIds?: string[];
}

export class CreateHistoryRequestDTO {
    @IsString()
    @IsNotEmpty()
    dietaryRestrictions!: string;

    @IsString()
    @IsNotEmpty()
    allergies!: string;

    @IsString()
    @IsNotEmpty()
    cuisine!: string;

    @IsString()
    @IsNotEmpty()
    groupType!: string;

    @IsString()
    @IsNotEmpty()
    budget!: string;

    @IsString()
    @IsNotEmpty({ message: 'recommendationName is required' })
    recommendationName!: string;

    @IsObject({ message: 'recommendationDetails must be a valid object' })
    recommendationDetails!: RecommendationPayload;
}
