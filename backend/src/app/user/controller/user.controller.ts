import { Controller, Delete, Get, Inject, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from '../service/user.service';
import { JwtAuthGuard } from '../../../lib/auth/guard';
import { httpStatus, sendSuccess } from '../../../lib/http/response';
import { validateBody } from '../../../lib/validation/validate';
import { UserUpdateRequestDTO } from '../dto/user.request.dto';
import { clearAuthCookies } from '../../../lib/utils/cookie';

@Controller('users')
export class UserController {
    constructor(@Inject(UserService) private readonly userService: UserService) {}

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@Req() req: Request, @Res() res: Response) {
        const userDto = await this.userService.getByUserId(req.user!.userId);
        return sendSuccess(res, userDto, httpStatus.OK);
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    async updateUserProfile(@Req() req: Request, @Res() res: Response) {
        const data = await validateBody(UserUpdateRequestDTO, req.body);
        const result = await this.userService.updateUserProfile(req.user!.userId, data);
        return sendSuccess(res, result, httpStatus.OK);
    }

    @Delete('me')
    @UseGuards(JwtAuthGuard)
    async deleteMe(@Req() req: Request, @Res() res: Response) {
        const result = await this.userService.deleteAccount(req.user!.userId);
        clearAuthCookies(res);
        return sendSuccess(res, result, httpStatus.OK);
    }
}
