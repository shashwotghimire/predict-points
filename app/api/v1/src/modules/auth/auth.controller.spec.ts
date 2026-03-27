jest.mock('./auth.service', () => ({
  AuthService: class AuthService {},
}));

import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    loginUser: jest.Mock;
  };

  const makeResponse = () =>
    ({
      req: {
        headers: {},
        cookies: {},
      },
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn(),
    }) as any;

  const authResult = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      role: 'USER',
      profilePicture: null,
    },
  };

  beforeEach(() => {
    authService = {
      loginUser: jest.fn(),
    };

    controller = new AuthController(authService as any);
  });

  it('uses cookies and only returns the user by default', async () => {
    authService.loginUser.mockResolvedValue(authResult);
    const response = makeResponse();

    const result = await controller.loginUser(
      { email: 'user@example.com', password: 'password123' },
      response,
    );

    expect(response.cookie).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ user: authResult.user });
  });

  it('rejects refresh requests without any refresh token source', async () => {
    const response = makeResponse();

    await expect(controller.refresh(response)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
