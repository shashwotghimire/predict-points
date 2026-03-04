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

function validateEnvironment(env: Record<string, string | undefined>) {
  if (env.NODE_ENV !== 'production') return env;

  const required = [
    'DATABASE_URL',
    'FRONTEND_URL',
    'CORS_ORIGIN',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`${key} is required in production`);
    }
  }

  if ((env.JWT_SECRET || '').length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }
  if ((env.JWT_REFRESH_SECRET || '').length < 32) {
    throw new Error('JWT_REFRESH_SECRET must contain at least 32 characters');
  }

  return env;
}

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
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
