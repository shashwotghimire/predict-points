import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { hashPassword, verifyHashedPassword } from 'src/utils/hash';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async ensureSeedAdminUser() {
    const seedEmail = process.env.SEED_ADMIN_EMAIL || 'system@predictpoints.local';
    const seedPassword = process.env.SEED_ADMIN_PASSWORD || 'seeded123';
    const seedName = process.env.SEED_ADMIN_NAME || 'System Admin';

    const existing = await this.prisma.user.findUnique({
      where: { email: seedEmail },
    });

    const hashedSeedPassword = await hashPassword(seedPassword);

    if (!existing) {
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
      return;
    }

    const isHashFormat = existing.password.startsWith('$2');
    if (!isHashFormat || existing.role !== 'ADMIN') {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashedSeedPassword,
          role: 'ADMIN',
          authProvider: 'LOCAL',
          name: existing.name || seedName,
        },
      });
    }
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
        secret: process.env.JWT_SECRET || 'dev-super-secret',
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
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any,
      },
    );
  }

  private async persistRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await hashPassword(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

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
    await this.ensureSeedAdminUser();
    const { email, name, phoneNumber, password, profilePicUrl } = registerUserDto;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');

    const hashedPassword = await hashPassword(password);

    const role =
      email.toLowerCase().startsWith('admin@') ||
      email.toLowerCase().includes('+admin')
        ? 'ADMIN'
        : 'USER';

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phoneNumber,
        profilePicUrl,
        role,
        authProvider: 'LOCAL',
      },
    });

    return this.buildAuthResponse(user);
  }

  async loginUser(loginUserDto: LoginUserDto) {
    await this.ensureSeedAdminUser();
    const { email, password } = loginUserDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
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

    const user = await this.prisma.user.upsert({
      where: { email: data.email },
      update: {
        name: data.name ?? undefined,
        profilePicUrl: data.picture ?? undefined,
        googleId: data.id ?? undefined,
        authProvider: 'GOOGLE',
      },
      create: {
        email: data.email,
        name: data.name ?? data.email.split('@')[0],
        profilePicUrl: data.picture ?? undefined,
        googleId: data.id ?? undefined,
        password: '__google_oauth__',
        authProvider: 'GOOGLE',
        role: 'USER',
      },
    });

    return this.buildAuthResponse(user);
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
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

      const valid = await verifyHashedPassword(refreshToken, user.refreshTokenHash);
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
