import { Module } from '@nestjs/common';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [RewardsController],
  providers: [RewardsService, PrismaService],
})
export class RewardsModule {}
