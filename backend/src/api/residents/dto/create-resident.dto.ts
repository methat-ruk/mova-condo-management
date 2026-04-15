import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ResidentType } from '../../../../generated/prisma/enums.js';

export class CreateResidentDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsUUID()
  @IsNotEmpty()
  unitId!: string;

  @IsEnum(ResidentType as object)
  residentType!: ResidentType;

  @IsDateString()
  moveInDate!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
