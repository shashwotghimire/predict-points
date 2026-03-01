import { Module } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { PredictionsController } from './predictions.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MarketsModule } from '../markets/markets.module';

@Module({
  imports: [MarketsModule],
  controllers: [PredictionsController],
  providers: [PredictionsService, PrismaService],
})
export class PredictionsModule {}
