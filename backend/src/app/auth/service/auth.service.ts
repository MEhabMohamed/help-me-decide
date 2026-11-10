import { Inject, Injectable } from '@nestjs/common';
import { toMs } from '../../../pkg/utils/times';
import { UserRepository } from '../../user/repository/user.repo';
import { UserService } from '../../user/service/user.service';
import {
    ForgotPasswordRequestDTO,
    GoogleAuthRequestDTO,
    LoginRequestDTO,
    RegisterRequestDTO,
    ResetPasswordRequestDTO,
    VerifyOtpRequestDTO,
} from '../dto/auth.request.dto';
import {
    AuthResponseDTO,
    ForgotPasswordResponseDTO,
    LogoutResponseDTO,
    RefreshTokenResponseDTO,
    ResetPasswordResponseDTO,
    VerifyOtpResponseDTO,
} from '../dto/auth.response.dto';
import {
    AccountRegisteredWithGoogle,
    EmailNotRegisteredError,
    GoogleAuthFailedError,
    IncorrectCredentials,
    InvalidOrExpiredOTP,
    OTPNotVerifiedError,
    PasswordsDoNotMatchError,
} from '../errors';
import { PasswordResetRepository } from '../repository/password-reset.repo';
import {
    comparePassword,
    createAccessToken,
    createRefreshToken,
    generateOTP,
    hashOTP,
    hashPassword,
    verfiyRefreshToken,
} from '../utils';
import { passwordResetEmail } from '../templates/reset-password.template';
import { IEmailProvider } from '../../../pkg/email/email.interface';
import { EMAIL_PROVIDER } from '../../../lib/email/init';
import { env } from '../../../lib/config/env';
import { AppError } from '../../../lib/error/AppError';
import { logger } from '../../../lib/logger/logger';

interface GoogleUserInfo {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
    aud?: string;
}

@Injectable()
export class AuthService {
    constructor(
        @Inject(UserService) private readonly userService: UserService,
        @Inject(UserRepository) private readonly userRepo: UserRepository,
        @Inject(PasswordResetRepository) private readonly passwordResetRepo: PasswordResetRepository,
        @Inject(EMAIL_PROVIDER) private readonly emailProvider: IEmailProvider
    ) {}

    register = async (data: RegisterRequestDTO): Promise<AuthResponseDTO> => {
        const user = await this.userService.create({
            name: data.name,
            email: data.email,
            password: data.password,
        });

        const payload = {
            userId: user.id,
            email: user.email,
            name: user.name,
        };

        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);

        return new AuthResponseDTO({
            message: 'User registered successfully',
            accessToken,
            refreshToken,
            user,
        });
    };

    login = async (data: LoginRequestDTO): Promise<AuthResponseDTO> => {
        const user = await this.userRepo.findUserByEmail(data.email);
        if (!user) {
            throw IncorrectCredentials;
        }

        if (!user.passwordHash) {
            throw AccountRegisteredWithGoogle;
        }

        const match = await comparePassword(data.password, user.passwordHash);
        if (!match) {
            throw IncorrectCredentials;
        }

        const payload = {
            userId: user.id,
            email: user.email,
            name: user.name,
        };

        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);

        return new AuthResponseDTO({
            message: 'User logged in successfully',
            accessToken,
            refreshToken,
            user,
        });
    };

    googleSignIn = async (data: GoogleAuthRequestDTO): Promise<AuthResponseDTO> => {
        if (!data.accessToken && !data.idToken) {
            throw new AppError('Google accessToken or idToken is required', 400);
        }

        let googlePayload: GoogleUserInfo;

        try {
            if (data.accessToken) {
                const response = await fetch(
                    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(data.accessToken)}`
                );
                if (!response.ok) {
                    throw new AppError('Invalid Google access token', 400);
                }
                googlePayload = (await response.json()) as GoogleUserInfo;
            } else {
                const response = await fetch(
                    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(data.idToken!)}`
                );
                if (!response.ok) {
                    throw new AppError('Invalid Google ID token', 400);
                }
                googlePayload = (await response.json()) as GoogleUserInfo;
                if (googlePayload.aud && googlePayload.aud !== env.google.clientId) {
                    throw new AppError('Google token audience mismatch', 400);
                }
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            logger.error('Google token verification failed', { error: String(err) });
            throw GoogleAuthFailedError;
        }

        const googleId = googlePayload.sub;
        const email = googlePayload.email.toLowerCase().trim();
        const name =
            googlePayload.name && googlePayload.name.trim().length >= 3
                ? googlePayload.name.trim()
                : email.split('@')[0].padEnd(3, 'x');
        const avatarUrl = googlePayload.picture ?? null;

        let user = await this.userRepo.findUserByGoogleIdOrEmail(googleId, email);

        if (!user) {
            user = await this.userRepo.createUser({
                email,
                name,
                googleId,
                passwordHash: null,
                avatarUrl,
            });
        } else {
            user = (await this.userRepo.updateGoogleProfile(user.id, {
                googleId,
                name: user.name || name,
                avatarUrl: avatarUrl || user.avatarUrl,
            }))!;
        }

        const payload = {
            userId: user.id,
            email: user.email,
            name: user.name,
        };

        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);

        return new AuthResponseDTO({
            message: 'User signed in with Google successfully',
            accessToken,
            refreshToken,
            user,
        });
    };

    forgotPassword = async (
        data: ForgotPasswordRequestDTO
    ): Promise<ForgotPasswordResponseDTO> => {
        // Step 1: Verify the email belongs to a registered user first
        const user = await this.userRepo.findUserByEmail(data.email);
        if (!user) {
            throw EmailNotRegisteredError;
        }

        const otp = generateOTP();
        const hashedOtp = await hashOTP(otp);

        await this.passwordResetRepo.createPasswordReset({
            userId: user.id,
            email: user.email,
            otpHash: hashedOtp,
            expiresAt: new Date(Date.now() + toMs.minute(10)),
            createdAt: new Date(),
        });

        const emailContent = passwordResetEmail(user.name, user.email, otp);
        await this.emailProvider.send(emailContent.to, emailContent.subject, emailContent.body);

        logger.info('Password reset OTP sent', { email: user.email });

        return new ForgotPasswordResponseDTO({
            message:
                'Email verified. A 6-digit OTP and verification link have been sent to your email.',
            email: user.email,
            redirectUrl: emailContent.redirectLink,
        });
    };

    verifyOtp = async (data: VerifyOtpRequestDTO): Promise<VerifyOtpResponseDTO> => {
        const user = await this.userRepo.findUserByEmail(data.email);
        if (!user) {
            throw InvalidOrExpiredOTP;
        }

        const reset = await this.passwordResetRepo.findLatestPasswordResetByUserId(user.id);
        if (!reset) {
            throw InvalidOrExpiredOTP;
        }

        const inputOtpHash = await hashOTP(data.otp);
        if (inputOtpHash !== reset.otpHash || reset.isExpired()) {
            throw InvalidOrExpiredOTP;
        }

        await this.passwordResetRepo.updatePasswordResetVerifiedAt(reset.id);

        return new VerifyOtpResponseDTO({
            message: 'OTP verified successfully. You may now set your new password.',
            verified: true,
            email: user.email,
        });
    };

    resetPassword = async (data: ResetPasswordRequestDTO): Promise<ResetPasswordResponseDTO> => {
        if (data.newPassword !== data.confirmPassword) {
            throw PasswordsDoNotMatchError;
        }

        const user = await this.userRepo.findUserByEmail(data.email);
        if (!user) {
            throw InvalidOrExpiredOTP;
        }

        const reset = await this.passwordResetRepo.findLatestPasswordResetByUserId(user.id);
        if (!reset) {
            throw InvalidOrExpiredOTP;
        }

        const inputOtpHash = await hashOTP(data.otp);
        if (inputOtpHash !== reset.otpHash || reset.isExpired()) {
            throw InvalidOrExpiredOTP;
        }

        if (!reset.verifiedAt) {
            throw OTPNotVerifiedError;
        }

        const hashedPassword = await hashPassword(data.newPassword);
        await this.userRepo.updateUserPassword(user.id, hashedPassword);
        await this.passwordResetRepo.updatePasswordResetConsumedAt(reset.id);

        return new ResetPasswordResponseDTO(
            'Password reset successfully, please login again!'
        );
    };

    refreshAccessToken = async (refreshToken: string): Promise<RefreshTokenResponseDTO> => {
        const decoded = verfiyRefreshToken(refreshToken);
        const user = await this.userRepo.findUserById(decoded.userId);
        if (!user) {
            throw InvalidOrExpiredOTP;
        }

        const payload = {
            userId: user.id,
            email: user.email,
            name: user.name,
        };
        const accessToken = createAccessToken(payload);
        return new RefreshTokenResponseDTO({
            message: 'Access token refreshed successfully',
            accessToken,
            refreshToken,
        });
    };

    logout = async (): Promise<LogoutResponseDTO> => {
        return new LogoutResponseDTO('Logged out successfully');
    };
}
