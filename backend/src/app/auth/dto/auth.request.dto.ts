import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Matches,
    MinLength,
    registerDecorator,
    ValidationOptions,
} from 'class-validator';

/**
 * Shared password validation rule matching the PDF specification:
 * - Minimum length of 8 characters
 * - At least one letter
 * - At least one number
 * - At least one special character
 * Used identically for both Sign Up password and Reset Password newPassword/confirmPassword.
 */
export const PDF_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
export const PDF_PASSWORD_MESSAGE =
    'Password must be at least 8 characters long and contain at least one letter, one number, and one special character';

export function IsPdfCompliantPassword(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isPdfCompliantPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: {
                message: PDF_PASSWORD_MESSAGE,
                ...validationOptions,
            },
            validator: {
                validate(value: unknown) {
                    return typeof value === 'string' && PDF_PASSWORD_REGEX.test(value);
                },
            },
        });
    };
}

export class RegisterRequestDTO {
    @IsString()
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    name!: string;

    @IsEmail({}, { message: 'Please provide a valid email address' })
    email!: string;

    @IsString()
    @IsPdfCompliantPassword()
    password!: string;
}

export class LoginRequestDTO {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    password!: string;
}

export class GoogleAuthRequestDTO {
    @IsOptional()
    @IsString()
    accessToken?: string;

    @IsOptional()
    @IsString()
    idToken?: string;
}

export class ForgotPasswordRequestDTO {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email!: string;
}

export class VerifyOtpRequestDTO {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email!: string;

    @IsString()
    @Length(6, 6, { message: 'OTP must be a 6-digit code' })
    @Matches(/^\d{6}$/, { message: 'OTP must contain 6 digits' })
    otp!: string;
}

export class ResetPasswordRequestDTO {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email!: string;

    @IsString()
    @Length(6, 6, { message: 'OTP must be a 6-digit code' })
    @Matches(/^\d{6}$/, { message: 'OTP must contain 6 digits' })
    otp!: string;

    @IsString()
    @IsPdfCompliantPassword()
    newPassword!: string;

    @IsString()
    @IsPdfCompliantPassword()
    confirmPassword!: string;
}

export class RefreshTokenRequestDTO {
    @IsOptional()
    @IsString()
    refreshToken?: string;
}

