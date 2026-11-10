import { User } from '../../user/entity/user.entity';
import { UserResponseDTO } from '../../user/dto/user.response.dto';

export class AuthResponseDTO {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: UserResponseDTO;

    constructor(params: {
        message: string;
        accessToken: string;
        refreshToken: string;
        user: User;
    }) {
        this.message = params.message;
        this.accessToken = params.accessToken;
        this.refreshToken = params.refreshToken;
        this.user = new UserResponseDTO(params.user);
    }
}

export class ForgotPasswordResponseDTO {
    message: string;
    email: string;
    redirectUrl: string;

    constructor(params: { message: string; email: string; redirectUrl: string }) {
        this.message = params.message;
        this.email = params.email;
        this.redirectUrl = params.redirectUrl;
    }
}

export class VerifyOtpResponseDTO {
    message: string;
    verified: boolean;
    email: string;

    constructor(params: { message: string; verified: boolean; email: string }) {
        this.message = params.message;
        this.verified = params.verified;
        this.email = params.email;
    }
}

export class ResetPasswordResponseDTO {
    message: string;

    constructor(message: string) {
        this.message = message;
    }
}

export class RefreshTokenResponseDTO {
    message: string;
    accessToken: string;
    refreshToken: string;

    constructor(params: { message: string; accessToken: string; refreshToken: string }) {
        this.message = params.message;
        this.accessToken = params.accessToken;
        this.refreshToken = params.refreshToken;
    }
}

export class LogoutResponseDTO {
    message: string;

    constructor(message: string) {
        this.message = message;
    }
}

