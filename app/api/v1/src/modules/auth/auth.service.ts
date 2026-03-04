import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { hashPassword, verifyHashedPassword } from 'src/utils/hash';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import crypto from 'crypto';
import {
  getRequiredSecret,
  parseBoolean,
  parsePositiveInt,
} from '../../common/security/env';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private googlePasswordHash: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.bootstrapAdminIfEnabled();
  }

  private async bootstrapAdminIfEnabled() {
    const shouldBootstrap = parseBoolean(process.env.BOOTSTRAP_ADMIN, false);
    if (!shouldBootstrap) return;

    const seedEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    const seedName = process.env.SEED_ADMIN_NAME?.trim() || 'System Admin';
    if (!seedEmail || !seedPassword) {
      throw new Error(
        'BOOTSTRAP_ADMIN=true requires SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.',
      );
    }

    if (seedPassword.length < 12) {
      throw new Error(
        'SEED_ADMIN_PASSWORD must contain at least 12 characters.',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: seedEmail },
    });

    if (existing) {
      if (!['ADMIN', 'SUPER_ADMIN'].includes(existing.role)) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { role: 'ADMIN' },
        });
      }
      this.logger.log(`Bootstrap admin already exists (${seedEmail}).`);
      return;
    }

    const hashedSeedPassword = await hashPassword(seedPassword);
    await this.prisma.user.create({
      data: {
        email: seedEmail,
        name: seedName,
        password: hashedSeedPassword,
        role: 'ADMIN',
        authProvider: 'LOCAL',
        points: 0,
      },
    });
    this.logger.warn(`Bootstrap admin created (${seedEmail}).`);
  }

  private get refreshTokenTtlDays() {
    return parsePositiveInt(process.env.REFRESH_TOKEN_TTL_DAYS, 30);
  }

  private async getGooglePasswordHash() {
    if (!this.googlePasswordHash) {
      this.googlePasswordHash = await hashPassword(
        crypto.randomBytes(32).toString('hex'),
      );
    }
    return this.googlePasswordHash;
  }

  private get oauthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google OAuth is not configured');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  private signAccessToken(user: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
  }) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name ?? undefined,
        type: 'access',
      },
      {
        secret: getRequiredSecret('JWT_SECRET'),
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
      },
    );
  }

  private signRefreshToken(user: { id: string; email: string; role: string }) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
      },
      {
        secret: getRequiredSecret('JWT_REFRESH_SECRET'),
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any,
      },
    );
  }

  private async persistRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await hashPassword(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenTtlDays);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash,
        refreshTokenExp: expiresAt,
      },
    });
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    profilePicUrl: string | null;
  }) {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    await this.persistRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicUrl,
      },
    };
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, phoneNumber, password, profilePicUrl } =
      registerUserDto;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) throw new BadRequestException('Email already registered');

    const hashedPassword = await hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedName,
        password: hashedPassword,
        phoneNumber,
        profilePicUrl,
        role: 'USER',
        authProvider: 'LOCAL',
      },
    });

    return this.buildAuthResponse(user);
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = await verifyHashedPassword(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    return this.buildAuthResponse(user);
  }

  createGoogleAuthUrl(state: string) {
    return this.oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'consent',
      state,
      include_granted_scopes: true,
    });
  }

  generateOauthState() {
    return crypto.randomBytes(24).toString('hex');
  }

  async completeGoogleAuth(code: string) {
    const client = this.oauthClient;
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      throw new UnauthorizedException('Google did not return an email');
    }

    const googlePasswordHash = await this.getGooglePasswordHash();
    const user = await this.prisma.user.upsert({
      where: { email: data.email.toLowerCase() },
      update: {
        name: data.name ?? undefined,
        profilePicUrl: data.picture ?? undefined,
        googleId: data.id ?? undefined,
        authProvider: 'GOOGLE',
      },
      create: {
        email: data.email.toLowerCase(),
        name: data.name ?? data.email.split('@')[0],
        profilePicUrl: data.picture ?? undefined,
        googleId: data.id ?? undefined,
        password: googlePasswordHash,
        authProvider: 'GOOGLE',
        role: 'USER',
      },
    });

    return this.buildAuthResponse(user);
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: getRequiredSecret('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh session');
      }

      if (user.refreshTokenExp && user.refreshTokenExp < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      const valid = await verifyHashedPassword(
        refreshToken,
        user.refreshTokenHash,
      );
      if (!valid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.buildAuthResponse(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null, refreshTokenExp: null },
    });

    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePicture: user.profilePicUrl,
    };
  }
}
