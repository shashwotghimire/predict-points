import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const activityUserSelect = {
  id: true,
  name: true,
  profilePicUrl: true,
  role: true,
} as const;

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async list(limit = 100) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    return this.prisma.activityLog.findMany({
      include: {
        user: { select: activityUserSelect },
        market: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });
  }
}
