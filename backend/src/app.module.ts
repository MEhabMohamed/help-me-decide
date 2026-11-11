import { Module } from '@nestjs/common';
import { MongoModule } from './lib/mongo/mongo.module';
import { UserModule } from './app/user/user.module';
import { AuthModule } from './app/auth/auth.module';
import { CookingModule } from './app/cooking/cooking.module';
import { HealthController } from './app/health/health.controller';

@Module({
    imports: [MongoModule, UserModule, AuthModule, CookingModule],
    controllers: [HealthController],
})
export class AppModule {}

