jest.mock('./auth.service', () => ({
  AuthService: class AuthService {},
}));

import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    loginUser: jest.Mock;
    completeGoogleAuth: jest.Mock;
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
      completeGoogleAuth: jest.fn(),
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

  it('redirects Google callback failures to frontend auth callback with error status', async () => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    const response = makeResponse();
    response.req.cookies.oauth_state = 'expected-state';

    await controller.googleCallback('oauth-code', 'different-state', response);

    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/auth/callback?status=error',
    );
  });

  it('redirects Google callback failures when the oauth code is missing', async () => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    const response = makeResponse();
    response.req.cookies.oauth_state = 'expected-state';

    await controller.googleCallback(
      undefined as any,
      'expected-state',
      response,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/auth/callback?status=error',
    );
  });

  it('redirects successful Google callbacks to frontend auth callback with success status', async () => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    authService.completeGoogleAuth.mockResolvedValue(authResult);
    const response = makeResponse();
    response.req.cookies.oauth_state = 'expected-state';

    await controller.googleCallback('oauth-code', 'expected-state', response);

    expect(authService.completeGoogleAuth).toHaveBeenCalledWith('oauth-code');
    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/auth/callback?status=success',
    );
  });

  it('redirects Google callback failures when oauth completion throws', async () => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    authService.completeGoogleAuth.mockRejectedValue(new Error('oauth failed'));
    const response = makeResponse();
    response.req.cookies.oauth_state = 'expected-state';

    await controller.googleCallback('oauth-code', 'expected-state', response);

    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/auth/callback?status=error',
    );
  });
});
