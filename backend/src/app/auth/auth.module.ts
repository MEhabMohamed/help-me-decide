import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { PasswordResetRepository } from './repository/password-reset.repo';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { EMAIL_PROVIDER, emailProvider } from '../../lib/email/init';

@Module({
    imports: [UserModule],
    controllers: [AuthController],
    providers: [
        PasswordResetRepository,
        AuthService,
        {
            provide: EMAIL_PROVIDER,
            useValue: emailProvider,
        },
    ],
    exports: [AuthService, PasswordResetRepository],
})
export class AuthModule {}

