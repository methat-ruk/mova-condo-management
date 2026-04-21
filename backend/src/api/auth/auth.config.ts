import { InternalServerErrorException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

function normalizeSecret(value?: string): string | null {
  const secret = value?.trim();
  return secret ? secret : null;
}

export function getRequiredJwtSecret(
  configService: ConfigService,
  primaryKey: string,
  fallbackKey = 'JWT_SECRET',
): string {
  const primarySecret = normalizeSecret(configService.get<string>(primaryKey));

  if (primarySecret) {
    return primarySecret;
  }

  const fallbackSecret = normalizeSecret(
    configService.get<string>(fallbackKey),
  );

  if (fallbackSecret) {
    return fallbackSecret;
  }

  throw new InternalServerErrorException(
    `Missing JWT secret configuration: set ${primaryKey} or ${fallbackKey} to a non-empty value`,
  );
}
