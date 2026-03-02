import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { MarketsModule } from './modules/markets/markets.module';
import { PredictionsModule } from './modules/predictions/predictions.module';
import { ActivityModule } from './modules/activity/activity.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { UsersModule } from './modules/users/users.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CloudinaryModule,
    MarketsModule,
    PredictionsModule,
    ActivityModule,
    RewardsModule,
    UsersModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
