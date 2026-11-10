import { Module } from '@nestjs/common';
import { MealHistoryRepository } from './repository/meal-history.repo';
import { CookingService } from './service/cooking.service';
import { CookingController } from './controller/cooking.controller';

@Module({
    controllers: [CookingController],
    providers: [MealHistoryRepository, CookingService],
    exports: [CookingService],
})
export class CookingModule {}

