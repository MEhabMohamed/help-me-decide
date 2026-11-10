import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { httpStatus, sendSuccess } from '../../lib/http/response';

@Controller('health')
export class HealthController {
    @Get()
    check(@Res() res: Response) {
        return sendSuccess(
            res,
            {
                status: 'ok',
                service: 'help-me-decide-backend',
                timestamp: new Date().toISOString(),
            },
            httpStatus.OK
        );
    }
}

