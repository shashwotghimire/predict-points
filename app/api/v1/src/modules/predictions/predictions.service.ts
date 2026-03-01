import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { MarketsService } from '../markets/markets.service';
import { PredictionStatus } from '../../../generated/prisma/enums';

@Injectable()
export class PredictionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketsService: MarketsService,
  ) {}

  create(dto: CreatePredictionDto & { userId: string }) {
    return this.marketsService.createPrediction({
      userId: dto.userId,
      marketId: dto.marketId,
      optionId: dto.optionId,
      pointsStaked: dto.pointsStaked ?? 100,
    });
  }

  async getById(id: string) {
    const prediction = await this.prisma.prediction.findUnique({
      where: { id },
      include: {
        option: true,
        market: { include: { options: true } },
      },
    });

    if (!prediction) throw new NotFoundException('Prediction not found');
    return prediction;
  }

  async getByUser(
    userId: string,
    query: {
      status?: string;
      search?: string;
      sort?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where = {
      userId,
      status: query.status
        ? (query.status.toUpperCase() as PredictionStatus)
        : undefined,
      OR: query.search
        ? [
            {
              market: {
                is: { title: { contains: query.search } },
              },
            },
            {
              option: {
                is: { label: { contains: query.search } },
              },
            },
          ]
        : undefined,
    };

    const orderBy =
      query.sort === 'points_desc'
        ? { potentialWinnings: 'desc' as const }
        : query.sort === 'points_asc'
          ? { potentialWinnings: 'asc' as const }
          : { createdAt: 'desc' as const };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.prediction.findMany({
        where,
        include: {
          option: true,
          market: { include: { options: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.prediction.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
