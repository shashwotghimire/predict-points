import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async list(limit = 100) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    return this.prisma.activityLog.findMany({
      include: { user: true, market: true },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });
  }
}
