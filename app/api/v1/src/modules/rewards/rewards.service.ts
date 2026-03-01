import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async listCatalog(query: {
    role: string;
    search?: string;
    includeInactive?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);
    const canViewInactive =
      query.includeInactive &&
      (query.role === 'ADMIN' || query.role === 'SUPER_ADMIN');

    const where = {
      isActive: canViewInactive ? undefined : true,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            {
              description: {
                contains: query.search,
                mode: 'insensitive' as const,
              },
            },
          ]
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.reward.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.reward.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async createReward(dto: CreateRewardDto) {
    return this.prisma.reward.create({
      data: {
        name: dto.name,
        description: dto.description,
        pointsRequired: dto.pointsRequired,
        iconKey: dto.iconKey,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateReward(id: string, dto: UpdateRewardDto) {
    return this.prisma.reward.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        pointsRequired: dto.pointsRequired,
        iconKey: dto.iconKey,
        isActive: dto.isActive,
      },
    });
  }

  async deleteReward(id: string) {
    await this.prisma.reward.delete({ where: { id } });
    return { success: true };
  }

  async redeem(userId: string, dto: RedeemRewardDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    const reward = await this.prisma.reward.findUnique({
      where: { id: dto.rewardId },
    });
    if (!reward || !reward.isActive) {
      throw new BadRequestException('Reward not available');
    }

    if (user.points < reward.pointsRequired) {
      throw new BadRequestException('Not enough points');
    }

    const [redemption] = await this.prisma.$transaction([
      this.prisma.rewardRedemption.create({
        data: {
          userId,
          rewardId: reward.id,
          rewardName: reward.name,
          pointsSpent: reward.pointsRequired,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { points: { decrement: reward.pointsRequired } },
      }),
      this.prisma.activityLog.create({
        data: {
          type: 'REWARD_REDEEMED',
          userId,
          message: `Reward redeemed: ${reward.name} (${reward.pointsRequired} points)`,
        },
      }),
      this.prisma.pointTransaction.create({
        data: {
          userId,
          amount: -reward.pointsRequired,
          type: 'PENALTY',
          reason: `Redeemed reward ${reward.name}`,
        },
      }),
    ]);

    return redemption;
  }

  async listUserRewards(
    userId: string,
    query: { search?: string; sort?: string; page?: number; pageSize?: number },
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where = {
      userId,
      rewardName: query.search
        ? { contains: query.search, mode: 'insensitive' as const }
        : undefined,
    };

    const orderBy =
      query.sort === 'points_desc'
        ? { pointsSpent: 'desc' as const }
        : query.sort === 'points_asc'
          ? { pointsSpent: 'asc' as const }
          : { createdAt: 'desc' as const };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.rewardRedemption.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.rewardRedemption.count({ where }),
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
