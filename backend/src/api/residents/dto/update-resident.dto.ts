import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ResidentType } from '../../../../generated/prisma/enums.js';

export class UpdateResidentDto {
  @IsOptional()
  @IsEnum(ResidentType as object)
  residentType?: ResidentType;

  @IsOptional()
  @IsString()
  note?: string;
}
