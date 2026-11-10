import { JwtPayload } from '../../app/auth/utils';

declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
            user?: JwtPayload;
        }
    }
}

