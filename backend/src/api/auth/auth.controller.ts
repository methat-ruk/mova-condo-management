import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  clearRefreshTokenCookie,
  getRefreshTokenCookieName,
  parseCookies,
  setRefreshTokenCookie,
} from './auth.cookies.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(dto);
    setRefreshTokenCookie(
      res,
      session.refreshToken,
      session.refreshTokenExpiresAt,
    );

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = parseCookies(req)[getRefreshTokenCookieName()];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    clearRefreshTokenCookie(res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = parseCookies(req)[getRefreshTokenCookieName()];
    const session = await this.authService.refresh(refreshToken);

    setRefreshTokenCookie(
      res,
      session.refreshToken,
      session.refreshTokenExpiresAt,
    );

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  getUsers() {
    return this.authService.getUsers();
  }
}
