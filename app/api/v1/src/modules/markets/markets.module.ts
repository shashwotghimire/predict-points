import { Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MarketsController],
  providers: [MarketsService, PrismaService],
  exports: [MarketsService],
})
export class MarketsModule {}
