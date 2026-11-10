import { Controller, Delete, Get, Inject, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { CookingService } from '../service/cooking.service';
import { JwtAuthGuard } from '../../../lib/auth/guard';
import { validateBody } from '../../../lib/validation/validate';
import { CreateHistoryRequestDTO, RecommendRequestDTO } from '../dto/cooking.request.dto';
import { httpStatus, sendSuccess } from '../../../lib/http/response';

@Controller()
@UseGuards(JwtAuthGuard)
export class CookingController {
    constructor(@Inject(CookingService) private readonly cookingService: CookingService) {}

    @Post('recommend')
    async recommend(@Req() req: Request, @Res() res: Response) {
        const data = await validateBody(RecommendRequestDTO, req.body);
        const result = await this.cookingService.recommend(req.user!.userId, data);
        return sendSuccess(res, result, httpStatus.OK);
    }

    @Post('history')
    async createHistory(@Req() req: Request, @Res() res: Response) {
        const data = await validateBody(CreateHistoryRequestDTO, req.body);
        const result = await this.cookingService.saveHistory(req.user!.userId, data);
        return sendSuccess(res, result, httpStatus.CREATED);
    }

    @Get('history')
    async getHistory(@Req() req: Request, @Res() res: Response) {
        const result = await this.cookingService.getHistory(req.user!.userId);
        return sendSuccess(res, result, httpStatus.OK);
    }

    @Delete('history/:id')
    async deleteHistory(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
        const result = await this.cookingService.deleteHistoryItem(req.user!.userId, id);
        return sendSuccess(res, result, httpStatus.OK);
    }
}
