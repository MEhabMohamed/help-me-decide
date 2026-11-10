import { IsOptional, IsString, MinLength } from 'class-validator';

export class UserUpdateRequestDTO {
    @IsString()
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    name!: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;
}

