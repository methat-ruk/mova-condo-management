import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AnnouncementStatus } from '../../../../generated/prisma/enums.js';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsEnum(AnnouncementStatus as object)
  @IsOptional()
  status?: AnnouncementStatus;

  @IsDateString()
  @IsOptional()
  expiredAt?: string;
}
