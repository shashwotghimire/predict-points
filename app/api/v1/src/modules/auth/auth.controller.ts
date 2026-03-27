import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CookieOptions, Response } from 'express';
import { parseBoolean, parsePositiveInt } from '../../common/security/env';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private cookieSettings() {
    const secure =
      process.env.COOKIE_SECURE === 'true' ||
      process.env.NODE_ENV === 'production';
    const sameSite = (process.env.COOKIE_SAMESITE || 'lax') as
      | 'lax'
      | 'none'
      | 'strict';
    const domain = process.env.COOKIE_DOMAIN || undefined;

    // SameSite=None requires Secure, otherwise browsers reject the cookie.
    const normalizedSameSite =
      sameSite === 'none' && !secure ? 'lax' : sameSite;
    const partitioned = parseBoolean(
      process.env.COOKIE_PARTITIONED,
      normalizedSameSite === 'none' && secure,
    );

    return {
      secure,
      sameSite: normalizedSameSite,
      domain,
      partitioned: partitioned && secure,
    };
  }

  private buildCookieOptions(
    path: string,
    maxAge?: number,
  ): CookieOptions & { partitioned?: boolean } {
    const { secure, sameSite, domain, partitioned } = this.cookieSettings();

    return {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path,
      maxAge,
      partitioned,
    };
  }

  private setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const accessMaxAgeMs = parsePositiveInt(
      process.env.ACCESS_TOKEN_TTL_MS,
      15 * 60 * 1000,
    );
    const refreshMaxAgeMs = parsePositiveInt(
      process.env.REFRESH_TOKEN_TTL_MS,
      30 * 24 * 60 * 60 * 1000,
    );

    res.cookie(
      'access_token',
      tokens.accessToken,
      this.buildCookieOptions('/', accessMaxAgeMs),
    );

    res.cookie(
      'refresh_token',
      tokens.refreshToken,
      this.buildCookieOptions('/api/v1/auth', refreshMaxAgeMs),
    );
  }

  private clearOauthCookies(res: Response) {
    res.clearCookie('oauth_state', this.buildCookieOptions('/'));
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', this.buildCookieOptions('/'));
    res.clearCookie('refresh_token', this.buildCookieOptions('/api/v1/auth'));
    this.clearOauthCookies(res);
  }

  @Post('register')
  async registerUser(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerUser(registerUserDto);
    this.setAuthCookies(res, result);
    return { user: result.user };
  }

  @Post('login')
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginUser(loginUserDto);
    this.setAuthCookies(res, result);
    return { user: result.user };
  }

  @Get('google/start')
  googleStart(@Res() res: Response) {
    const state = this.authService.generateOauthState();
    res.cookie(
      'oauth_state',
      state,
      this.buildCookieOptions('/', 1000 * 60 * 10),
    );

    const url = this.authService.createGoogleAuthUrl(state);
    return res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const cookieState = res.req.cookies?.oauth_state;
    if (!cookieState || cookieState !== state) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const result = await this.authService.completeGoogleAuth(code);
    this.setAuthCookies(res, result);
    this.clearOauthCookies(res);

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontend}/dashboard`);
  }

  @Post('refresh')
  async refresh(@Res({ passthrough: true }) res: Response) {
    const refreshToken = res.req.cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const result = await this.authService.refreshAccessToken(refreshToken);
    this.setAuthCookies(res, result);
    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    this.clearAuthCookies(res);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
