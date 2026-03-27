jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { MarketsService } from './markets.service';

describe('MarketsService', () => {
  let service: MarketsService;
  let prisma: any;
  let realtime: { broadcast: jest.Mock };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) =>
        callback(prisma),
      ),
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      market: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      option: {
        findFirst: jest.fn(),
      },
      prediction: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      pointTransaction: {
        create: jest.fn(),
      },
      activityLog: {
        create: jest.fn(),
      },
    };
    realtime = {
      broadcast: jest.fn(),
    };

    service = new MarketsService(prisma, realtime as any);
  });

  it('blocks admins from submitting predictions', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
    });

    await expect(
      service.createPrediction({
        userId: 'admin-1',
        marketId: 'market-1',
        optionId: 'option-1',
        pointsStaked: 100,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects duplicate predictions for the same user and market', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'USER',
    });
    prisma.market.findUnique.mockResolvedValue({
      id: 'market-1',
      status: 'OPEN',
      closesAt: new Date(Date.now() + 60_000),
    });
    prisma.prediction.findUnique.mockResolvedValue({ id: 'prediction-1' });

    await expect(
      service.createPrediction({
        userId: 'user-1',
        marketId: 'market-1',
        optionId: 'option-1',
        pointsStaked: 100,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('stores the calculated potential winnings and broadcasts success', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'USER',
      name: 'Taylor',
      email: 'taylor@example.com',
    });
    prisma.market.findUnique.mockResolvedValue({
      id: 'market-1',
      status: 'OPEN',
      closesAt: new Date(Date.now() + 60_000),
    });
    prisma.prediction.findUnique.mockResolvedValue(null);
    prisma.option.findFirst.mockResolvedValue({
      id: 'option-1',
      label: 'Yes',
      percentage: 40,
    });
    prisma.prediction.create.mockResolvedValue({
      id: 'prediction-1',
      potentialWinnings: 500,
      option: { label: 'Yes' },
      market: {
        title: 'Will it rain tomorrow?',
        options: [],
      },
    });
    prisma.activityLog.create.mockResolvedValue({ id: 'activity-1' });

    const prediction = await service.createPrediction({
      userId: 'user-1',
      marketId: 'market-1',
      optionId: 'option-1',
      pointsStaked: 200,
    });

    expect(prediction).toEqual(
      expect.objectContaining({
        id: 'prediction-1',
        potentialWinnings: 500,
      }),
    );
    expect(prisma.prediction.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        marketId: 'market-1',
        optionId: 'option-1',
        pointsStaked: 200,
        potentialWinnings: 500,
      },
      include: {
        option: true,
        market: {
          include: { options: true },
        },
      },
    });
    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'PREDICTION_SUBMITTED',
        marketId: 'market-1',
        userId: 'user-1',
        message: expect.stringContaining('potential 500 points'),
      }),
    });
    expect(realtime.broadcast).toHaveBeenCalledWith(
      ['markets', 'market', 'activity', 'user-predictions', 'predictions'],
      {
        marketId: 'market-1',
        userId: 'user-1',
      },
    );
  });

  it('converts a unique-constraint race into a conflict error', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'USER',
      name: 'Taylor',
      email: 'taylor@example.com',
    });
    prisma.market.findUnique.mockResolvedValue({
      id: 'market-1',
      status: 'OPEN',
      closesAt: new Date(Date.now() + 60_000),
    });
    prisma.prediction.findUnique.mockResolvedValue(null);
    prisma.option.findFirst.mockResolvedValue({
      id: 'option-1',
      label: 'Yes',
      percentage: 40,
    });
    prisma.prediction.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.createPrediction({
        userId: 'user-1',
        marketId: 'market-1',
        optionId: 'option-1',
        pointsStaked: 200,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects predictions after the market has closed', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'USER',
    });
    prisma.market.findUnique.mockResolvedValue({
      id: 'market-1',
      status: 'OPEN',
      closesAt: new Date(Date.now() - 60_000),
    });

    await expect(
      service.createPrediction({
        userId: 'user-1',
        marketId: 'market-1',
        optionId: 'option-1',
        pointsStaked: 100,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('declares a market transactionally and emits per-user realtime updates', async () => {
    prisma.market.findUnique
      .mockResolvedValueOnce({
        id: 'market-1',
        title: 'Will it rain tomorrow?',
        options: [],
        comments: [],
        oddsSnapshots: [],
      })
      .mockResolvedValueOnce({
        id: 'market-1',
        title: 'Will it rain tomorrow?',
        status: 'RESOLVED',
        options: [],
        comments: [],
        oddsSnapshots: [],
      });
    prisma.option.findFirst.mockResolvedValue({
      id: 'option-1',
      marketId: 'market-1',
    });
    prisma.market.update.mockResolvedValue({ id: 'market-1' });
    prisma.prediction.findMany.mockResolvedValue([
      {
        id: 'prediction-1',
        userId: 'user-1',
        optionId: 'option-1',
        potentialWinnings: 250,
      },
      {
        id: 'prediction-2',
        userId: 'user-2',
        optionId: 'option-2',
        potentialWinnings: 400,
      },
    ]);
    prisma.prediction.update.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});
    prisma.pointTransaction.create.mockResolvedValue({});
    prisma.activityLog.create.mockResolvedValue({});

    const declaredMarket = await service.declare('market-1', {
      optionId: 'option-1',
    });

    expect(declaredMarket).toEqual(
      expect.objectContaining({
        id: 'market-1',
        status: 'RESOLVED',
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pointTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        amount: 250,
        type: 'WIN',
      }),
    });
    expect(realtime.broadcast).toHaveBeenNthCalledWith(
      1,
      ['markets', 'market', 'activity', 'leaderboard', 'admin-users'],
      { marketId: 'market-1' },
    );
    expect(realtime.broadcast).toHaveBeenNthCalledWith(
      2,
      ['user-predictions', 'user-points'],
      { marketId: 'market-1', userId: 'user-1' },
    );
    expect(realtime.broadcast).toHaveBeenNthCalledWith(
      3,
      ['user-predictions'],
      { marketId: 'market-1', userId: 'user-2' },
    );
  });
});
