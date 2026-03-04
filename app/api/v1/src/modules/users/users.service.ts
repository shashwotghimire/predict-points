import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PredictionStatus, UserRole } from '../../../generated/prisma/enums';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        points: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getUserPoints(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { userId, points: user.points };
  }

  async getLeaderboard(limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const users = await this.prisma.user.findMany({
      where: {
        role: UserRole.USER,
      },
      select: {
        id: true,
        name: true,
        points: true,
        createdAt: true,
      },
      orderBy: [{ points: 'desc' }, { createdAt: 'asc' }],
      take: safeLimit,
    });

    if (!users.length) return [];

    const userIds = users.map((user) => user.id);
    const resolvedPredictions = await this.prisma.prediction.findMany({
      where: {
        userId: { in: userIds },
        status: { in: [PredictionStatus.WON, PredictionStatus.LOST] },
      },
      select: {
        userId: true,
        status: true,
      },
    });

    const resolvedMap = new Map<string, number>();
    const wonMap = new Map<string, number>();

    for (const prediction of resolvedPredictions) {
      resolvedMap.set(
        prediction.userId,
        (resolvedMap.get(prediction.userId) ?? 0) + 1,
      );
      if (prediction.status === PredictionStatus.WON) {
        wonMap.set(prediction.userId, (wonMap.get(prediction.userId) ?? 0) + 1);
      }
    }

    return users.map((user, index) => {
      const resolvedPredictions = resolvedMap.get(user.id) ?? 0;
      const wonPredictions = wonMap.get(user.id) ?? 0;
      const accuracy =
        resolvedPredictions > 0
          ? Math.round((wonPredictions / resolvedPredictions) * 100)
          : 0;

      return {
        rank: index + 1,
        userId: user.id,
        username: user.name?.trim() || `User ${index + 1}`,
        points: user.points,
        accuracy,
        wonPredictions,
        resolvedPredictions,
      };
    });
  }
}
