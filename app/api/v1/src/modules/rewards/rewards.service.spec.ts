jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { BadRequestException } from '@nestjs/common';
import { RewardsService } from './rewards.service';

describe('RewardsService', () => {
  let service: RewardsService;
  let prisma: any;
  let realtime: { broadcast: jest.Mock };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) =>
        callback(prisma),
      ),
      user: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      reward: {
        findUnique: jest.fn(),
      },
      rewardRedemption: {
        create: jest.fn(),
      },
      activityLog: {
        create: jest.fn(),
      },
      pointTransaction: {
        create: jest.fn(),
      },
    };
    realtime = {
      broadcast: jest.fn(),
    };

    service = new RewardsService(prisma, realtime as any);
  });

  it('rejects topup rewards without a valid phone number', async () => {
    prisma.reward.findUnique.mockResolvedValue({
      id: 'reward-1',
      name: 'Mobile Topup',
      type: 'TOPUP',
      pointsRequired: 100,
      isActive: true,
    });

    await expect(
      service.redeem('user-1', {
        rewardId: 'reward-1',
        phoneNumber: 'abc',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.rewardRedemption.create).not.toHaveBeenCalled();
  });

  it('normalizes redemption data and broadcasts updates on success', async () => {
    prisma.reward.findUnique.mockResolvedValue({
      id: 'reward-1',
      name: 'Gift Card',
      type: 'GIFT_CARD',
      pointsRequired: 250,
      isActive: true,
    });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.rewardRedemption.create.mockResolvedValue({ id: 'redemption-1' });
    prisma.activityLog.create.mockResolvedValue({ id: 'activity-1' });
    prisma.pointTransaction.create.mockResolvedValue({ id: 'transaction-1' });

    const redemption = await service.redeem('user-1', {
      rewardId: 'reward-1',
      email: '  Winner@Example.COM ',
      note: '  Send ASAP ',
    });

    expect(redemption).toEqual({ id: 'redemption-1' });
    expect(prisma.rewardRedemption.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        rewardId: 'reward-1',
        pointsSpent: 250,
        redemptionData: {
          email: 'winner@example.com',
          note: 'Send ASAP',
        },
      }),
    });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
        points: { gte: 250 },
      },
      data: {
        points: { decrement: 250 },
      },
    });
    expect(realtime.broadcast).toHaveBeenCalledWith(
      [
        'user-points',
        'user-rewards',
        'rewards-catalog',
        'activity',
        'leaderboard',
        'admin-users',
      ],
      { userId: 'user-1' },
    );
  });

  it('fails redemption when the conditional debit cannot reserve points', async () => {
    prisma.reward.findUnique.mockResolvedValue({
      id: 'reward-1',
      name: 'Gift Card',
      type: 'GIFT_CARD',
      pointsRequired: 250,
      isActive: true,
    });
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await expect(
      service.redeem('user-1', {
        rewardId: 'reward-1',
        email: 'winner@example.com',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.rewardRedemption.create).not.toHaveBeenCalled();
    expect(realtime.broadcast).not.toHaveBeenCalled();
  });
});
