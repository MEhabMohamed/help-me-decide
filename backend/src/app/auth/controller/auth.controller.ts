import { Controller, Get, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../service/auth.service';
import { validateBody } from '../../../lib/validation/validate';
import {
    ForgotPasswordRequestDTO,
    GoogleAuthRequestDTO,
    LoginRequestDTO,
    RefreshTokenRequestDTO,
    RegisterRequestDTO,
    ResetPasswordRequestDTO,
    VerifyOtpRequestDTO,
} from '../dto/auth.request.dto';
import { toMs } from '../../../pkg/utils/times';
import { env } from '../../../lib/config/env';
import { NoRefreshTokenFound } from '../errors';
import { httpStatus, sendSuccess } from '../../../lib/http/response';
import { clearAuthCookies, setAuthCookies } from '../../../lib/utils/cookie';
import { JwtAuthGuard } from '../../../lib/auth/guard';
import { UserService } from '../../user/service/user.service';

@Controller('auth')
export class AuthController {
    constructor(
        @Inject(AuthService) private readonly authService: AuthService,
        @Inject(UserService) private readonly userService: UserService
    ) {}

    @Post('register')
    async register(@Req() req: Request, @Res() res: Response) {
        const data = await validateBody(RegisterRequestDTO, req.body);
        const result = await this.authService.register(data);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        return sendSuccess(res, result, httpStatus.CREATED);
    }

    @Post('login')
    async login(@Req() req: Request, @Res() res: Response) {
        const data = await validateBody(LoginRequestDTO, req.body);
        const result = await this.authService.login(data);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        return sendSuccess(res, result, httpStatus.OK);
    }

    @Post('google')
    async googleSignIn(@Req() req: Request, @Res() res: Response) {
        const data = await validateBody(GoogleAuthRequestDTO, req.body);
        const result = await this.authService.googleSignIn(data);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        return sendSuccess(res, result, httpStatus.OK);
    }

    @Post('forgot-password')
    async forgotPassword(@Req() req: Request, @Res() res: Response) {
        const data = await validateBody(ForgotPasswordRequestDTO, req.body);
        const result = await this.authService.forgotPassword(data);
        return sendSuccess(res, result, httpStatus.OK);
    }

    @Post('verify-otp')
    async verifyOtp(@Req() req: Request, @Res() res: Response) {
        const data = await validateBody(VerifyOtpRequestDTO, req.body);
        const result = await this.authService.verifyOtp(data);
        return sendSuccess(res, result, httpStatus.OK);
    }

    @Post('reset-password')
    async resetPassword(@Req() req: Request, @Res() res: Response) {
        const data = await validateBody(ResetPasswordRequestDTO, req.body);
        const result = await this.authService.resetPassword(data);
        return sendSuccess(res, result, httpStatus.OK);
    }

    @Post('refresh')
    async refreshAccessToken(@Req() req: Request, @Res() res: Response) {
        const body = await validateBody(RefreshTokenRequestDTO, req.body);
        const refreshToken = req.cookies?.refresh_token || body.refreshToken;
        if (!refreshToken) {
            throw NoRefreshTokenFound;
        }
        const result = await this.authService.refreshAccessToken(refreshToken);
        res.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: env.nodeEnv === 'production',
            sameSite: 'lax',
            maxAge: toMs.hour(1),
        });
        return sendSuccess(res, result, httpStatus.OK);
    }

    @Post('logout')
    async logout(@Res() res: Response) {
        const result = await this.authService.logout();
        clearAuthCookies(res);
        return sendSuccess(res, result, httpStatus.OK);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@Req() req: Request, @Res() res: Response) {
        const userDto = await this.userService.getByUserId(req.user!.userId);
        return sendSuccess(res, userDto, httpStatus.OK);
    }
}
