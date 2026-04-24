import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const datasourceUrl = process.env.DATABASE_URL?.trim();
    if (!datasourceUrl) {
      throw new Error('DATABASE_URL must be set before Prisma initializes.');
    }

    super({
      datasourceUrl,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
