import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { User } from '../../../generated/prisma/client.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service.js';
import { getRequiredJwtSecret } from './auth.config.js';
import type { LoginDto } from './dto/login.dto.js';
import type {
  AuthSessionPayload,
  RefreshTokenPayload,
} from './interfaces/auth-session.interface.js';

interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: Omit<User, 'password'>;
}

type DurationString = `${number}${'m' | 'h' | 'd'}`;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getAccessTokenSecret(): string {
    return getRequiredJwtSecret(this.configService, 'JWT_ACCESS_SECRET');
  }

  private getRefreshTokenSecret(): string {
    return getRequiredJwtSecret(this.configService, 'JWT_REFRESH_SECRET');
  }

  private getAccessTokenExpiresIn(): DurationString {
    return (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ??
      '15m') as DurationString;
  }

  private getRefreshTokenExpiresIn(): DurationString {
    return (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ??
      '30d') as DurationString;
  }

  private parseExpiryToDate(value: DurationString): Date {
    const match = value.match(/^(\d+)([mhd])$/);

    if (!match) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + amount * multipliers[unit]);
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  private async createSession(user: User): Promise<AuthSessionResult> {
    const basePayload: AuthSessionPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const refreshTokenId = randomUUID();
    const refreshTokenExpiresAt = this.parseExpiryToDate(
      this.getRefreshTokenExpiresIn(),
    );

    await this.prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(basePayload, {
        secret: this.getAccessTokenSecret(),
        expiresIn: this.getAccessTokenExpiresIn(),
      }),
      this.jwtService.signAsync(
        {
          ...basePayload,
          jti: refreshTokenId,
          type: 'refresh',
        } satisfies RefreshTokenPayload,
        {
          secret: this.getRefreshTokenSecret(),
          expiresIn: this.getRefreshTokenExpiresIn(),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
      user: this.sanitizeUser(user),
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.getRefreshTokenSecret(),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.createSession(user);
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.createSession(storedToken.user);
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        id: payload.jti,
        userId: payload.sub,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return this.sanitizeUser(user);
  }

  async getUsers() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: { firstName: 'asc' },
    });
    return users;
  }
}
