import type { UserRole } from '../../../../generated/prisma/enums.js';

export interface AuthSessionPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload extends AuthSessionPayload {
  jti: string;
  type: 'refresh';
}
