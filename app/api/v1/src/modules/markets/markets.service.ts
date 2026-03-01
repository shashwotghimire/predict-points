import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { SetOddsDto } from './dto/set-odds.dto';
import { DeclareMarketDto } from './dto/declare-market.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { MarketCategory, MarketStatus, MarketType, PredictionStatus } from '../../../generated/prisma/enums';

@Injectable()
export class MarketsService {
  constructor(private readonly prisma: PrismaService) {}

  private potentialWinnings(percentage: number, stake = 100) {
    if (percentage <= 0) return stake;
    return Math.round((stake * 100) / percentage);
  }

  async seedIfEmpty() {
    const count = await this.prisma.market.count();
    if (count > 0) return;

    let systemUser = await this.prisma.user.findUnique({
      where: { email: 'system@predictpoints.local' },
    });

    if (!systemUser) {
      systemUser = await this.prisma.user.create({
        data: {
          email: 'system@predictpoints.local',
          name: 'System',
          password: 'seeded',
          role: 'ADMIN',
          points: 0,
        },
      });
    }

    const samples = [
      {
        title: 'Will coalition government form in Nepal before June 2026?',
        description: 'Prediction on federal coalition formation timeline.',
        category: 'POLITICS' as MarketCategory,
        type: 'YES_NO' as MarketType,
        closesAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        options: [
          { label: 'Yes', percentage: 56 },
          { label: 'No', percentage: 44 },
        ],
      },
      {
        title: 'Who wins the Kathmandu derby?',
        description: 'Match outcome event with four options.',
        category: 'SPORTS' as MarketCategory,
        type: 'MULTI_4' as MarketType,
        closesAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        options: [
          { label: 'Team A', percentage: 31 },
          { label: 'Team B', percentage: 27 },
          { label: 'Draw', percentage: 24 },
          { label: 'Cancelled', percentage: 18 },
        ],
      },
    ];

    for (const sample of samples) {
      const market = await this.prisma.market.create({
        data: {
          title: sample.title,
          description: sample.description,
          category: sample.category,
          type: sample.type,
          closesAt: sample.closesAt,
          createdById: systemUser.id,
          options: {
            create: sample.options,
          },
        },
        include: { options: true },
      });

      await this.prisma.oddsSnapshot.createMany({
        data: market.options.map((option) => ({
          marketId: market.id,
          optionId: option.id,
          percentage: option.percentage,
        })),
      });
    }
  }

  async listMarkets(query: { category?: string; search?: string; status?: string }) {
    await this.seedIfEmpty();

    const markets = await this.prisma.market.findMany({
      where: {
        category: query.category as MarketCategory | undefined,
        status: query.status as MarketStatus | undefined,
        OR: query.search
          ? [
              { title: { contains: query.search, mode: 'insensitive' } },
              { id: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        options: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
        oddsSnapshots: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return markets;
  }

  async getMarket(id: string) {
    await this.seedIfEmpty();

    const market = await this.prisma.market.findUnique({
      where: { id },
      include: {
        options: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
        oddsSnapshots: {
          include: { option: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!market) throw new NotFoundException('Market not found');
    return market;
  }

  async createMarket(dto: CreateMarketDto) {
    if (!dto.options?.length) {
      throw new BadRequestException('At least one option is required');
    }

    const market = await this.prisma.market.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category as MarketCategory,
        type: dto.type as MarketType,
        closesAt: new Date(dto.closesAt),
        eventIconUrl: dto.eventIconUrl,
        createdById: dto.createdById,
        options: {
          create: dto.options.map((option) => ({
            label: option.label,
            percentage: option.percentage,
          })),
        },
      },
      include: { options: true },
    });

    await this.prisma.oddsSnapshot.createMany({
      data: market.options.map((option) => ({
        marketId: market.id,
        optionId: option.id,
        percentage: option.percentage,
      })),
    });

    await this.prisma.activityLog.create({
      data: {
        type: 'EVENT_CREATED',
        marketId: market.id,
        userId: dto.createdById,
        message: `Event created: ${market.title}`,
      },
    });

    return this.getMarket(market.id);
  }

  async updateMarket(id: string, dto: UpdateMarketDto) {
    await this.prisma.market.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        closesAt: dto.closesAt ? new Date(dto.closesAt) : undefined,
        eventIconUrl: dto.eventIconUrl,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        type: 'EVENT_UPDATED',
        marketId: id,
        message: `Event updated: ${id}`,
      },
    });

    return this.getMarket(id);
  }

  async deleteMarket(id: string) {
    await this.prisma.$transaction([
      this.prisma.activityLog.create({
        data: {
          type: 'EVENT_DELETED',
          marketId: id,
          message: `Event deleted: ${id}`,
        },
      }),
      this.prisma.market.delete({ where: { id } }),
    ]);

    return { success: true };
  }

  async setOdds(id: string, dto: SetOddsDto) {
    const market = await this.getMarket(id);

    for (const option of dto.options) {
      await this.prisma.option.update({
        where: { id: option.optionId },
        data: { percentage: option.percentage },
      });

      await this.prisma.oddsSnapshot.create({
        data: {
          marketId: id,
          optionId: option.optionId,
          percentage: option.percentage,
        },
      });
    }

    await this.prisma.activityLog.create({
      data: {
        type: 'EVENT_UPDATED',
        marketId: id,
        message: `Odds updated for ${market.title}`,
      },
    });

    return this.getMarket(id);
  }

  async declare(id: string, dto: DeclareMarketDto) {
    const market = await this.getMarket(id);

    await this.prisma.market.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        isDeclared: true,
        declaredAt: new Date(),
        declaredOptionId: dto.optionId,
      },
    });

    const predictions = await this.prisma.prediction.findMany({
      where: { marketId: id, status: 'ACTIVE' },
    });

    for (const prediction of predictions) {
      const won = prediction.optionId === dto.optionId;
      await this.prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          status: won ? PredictionStatus.WON : PredictionStatus.LOST,
          isWinning: won,
          resolvedAt: new Date(),
        },
      });

      if (won) {
        await this.prisma.user.update({
          where: { id: prediction.userId },
          data: { points: { increment: prediction.potentialWinnings } },
        });
      }
    }

    await this.prisma.activityLog.create({
      data: {
        type: 'EVENT_DECLARED',
        marketId: id,
        message: `Event declared: ${market.title}`,
      },
    });

    return this.getMarket(id);
  }

  async createComment(marketId: string, dto: CreateCommentDto) {
    const comment = await this.prisma.eventComment.create({
      data: {
        marketId,
        userId: dto.userId,
        content: dto.message,
      },
      include: { user: true },
    });

    await this.prisma.activityLog.create({
      data: {
        type: 'COMMENT_ADDED',
        marketId,
        userId: dto.userId,
        message: `${comment.user.name ?? comment.user.email} commented on ${marketId}`,
      },
    });

    return comment;
  }

  async getComments(marketId: string) {
    return this.prisma.eventComment.findMany({
      where: { marketId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActivity() {
    return this.prisma.activityLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getUserPoints(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { points: user.points };
  }

  async createPrediction(input: {
    userId: string;
    marketId: string;
    optionId: string;
    pointsStaked: number;
  }) {
    const option = await this.prisma.option.findUnique({
      where: { id: input.optionId },
    });
    if (!option) throw new NotFoundException('Option not found');

    const potentialWinnings = this.potentialWinnings(
      option.percentage,
      input.pointsStaked,
    );

    const prediction = await this.prisma.prediction.upsert({
      where: {
        userId_marketId: {
          userId: input.userId,
          marketId: input.marketId,
        },
      },
      update: {
        optionId: input.optionId,
        pointsStaked: input.pointsStaked,
        potentialWinnings,
        status: 'ACTIVE',
        isWinning: false,
        resolvedAt: null,
      },
      create: {
        userId: input.userId,
        marketId: input.marketId,
        optionId: input.optionId,
        pointsStaked: input.pointsStaked,
        potentialWinnings,
      },
      include: {
        option: true,
        market: {
          include: { options: true },
        },
        user: true,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        type: 'PREDICTION_SUBMITTED',
        marketId: input.marketId,
        userId: input.userId,
        message: `${prediction.user.name ?? prediction.user.email} predicted '${prediction.option.label}' on '${prediction.market.title}' (potential ${potentialWinnings} points)`,
      },
    });

    return prediction;
  }
}
