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
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private cookieSettings() {
    const secure =
      process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
    const sameSite = (process.env.COOKIE_SAMESITE || (secure ? 'none' : 'lax')) as
      | 'lax'
      | 'none'
      | 'strict';
    const domain = process.env.COOKIE_DOMAIN || undefined;

    return { secure, sameSite, domain };
  }

  private setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const { secure, sameSite, domain } = this.cookieSettings();
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
      maxAge: 1000 * 60 * 15,
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }

  private clearAuthCookies(res: Response) {
    const { domain } = this.cookieSettings();
    res.clearCookie('access_token', { path: '/', domain });
    res.clearCookie('refresh_token', { path: '/', domain });
    res.clearCookie('oauth_state', { path: '/', domain });
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
    const { secure, sameSite, domain } = this.cookieSettings();
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
      maxAge: 1000 * 60 * 10,
    });

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
