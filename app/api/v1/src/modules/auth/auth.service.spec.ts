jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
  };
  let jwtService: {
    sign: jest.Mock;
    verifyAsync: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    jwtService = {
      sign: jest.fn(),
      verifyAsync: jest.fn(),
    };

    service = new AuthService(prisma as any, jwtService as any);
  });

  it('generates an opaque oauth state token', () => {
    const state = service.generateOauthState();

    expect(state).toMatch(/^[a-f0-9]{48}$/);
  });

  it('rejects login when the user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.loginUser({
        email: 'missing@example.com',
        password: 'secret123',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'missing@example.com' },
    });
  });
});
