import { Module } from '@nestjs/common';
import { UserRepository } from './repository/user.repo';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';

@Module({
    controllers: [UserController],
    providers: [UserRepository, UserService],
    exports: [UserRepository, UserService],
})
export class UserModule {}

