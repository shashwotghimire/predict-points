import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedeemRewardDto } from './dto/redeem-reward.dto';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async redeem(dto: RedeemRewardDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.points < dto.pointsSpent) {
      throw new BadRequestException('Not enough points');
    }

    const [redemption] = await this.prisma.$transaction([
      this.prisma.rewardRedemption.create({
        data: {
          userId: dto.userId,
          rewardName: dto.rewardName,
          pointsSpent: dto.pointsSpent,
        },
      }),
      this.prisma.user.update({
        where: { id: dto.userId },
        data: { points: { decrement: dto.pointsSpent } },
      }),
      this.prisma.activityLog.create({
        data: {
          type: 'REWARD_REDEEMED',
          userId: dto.userId,
          message: `Reward redeemed: ${dto.rewardName} (${dto.pointsSpent} points)`,
        },
      }),
      this.prisma.pointTransaction.create({
        data: {
          userId: dto.userId,
          amount: -dto.pointsSpent,
          type: 'PENALTY',
          reason: `Redeemed reward ${dto.rewardName}`,
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
