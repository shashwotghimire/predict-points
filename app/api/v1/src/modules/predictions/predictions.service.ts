import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async getById(
    id: string,
    currentUser: { currentUserId: string; currentUserRole: string },
  ) {
    const prediction = await this.prisma.prediction.findUnique({
      where: { id },
      include: {
        option: true,
        market: { include: { options: true } },
      },
    });

    if (!prediction) throw new NotFoundException('Prediction not found');
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(
      currentUser.currentUserRole,
    );
    if (!isAdmin && prediction.userId !== currentUser.currentUserId) {
      throw new ForbiddenException('You can only view your own predictions');
    }
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
    const page =
      Number.isFinite(query.page) && (query.page ?? 0) > 0
        ? Math.floor(query.page as number)
        : 1;
    const pageSize =
      Number.isFinite(query.pageSize) && (query.pageSize ?? 0) > 0
        ? Math.min(Math.floor(query.pageSize as number), 100)
        : 10;
    const normalizedStatus = query.status?.toUpperCase();
    const statusFilter =
      normalizedStatus &&
      Object.values(PredictionStatus).includes(
        normalizedStatus as PredictionStatus,
      )
        ? (normalizedStatus as PredictionStatus)
        : undefined;

    const where = {
      userId,
      status: statusFilter,
      OR: query.search
        ? [
            {
              market: {
                is: {
                  title: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            },
            {
              option: {
                is: {
                  label: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
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
