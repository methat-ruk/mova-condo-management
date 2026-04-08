import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { OccupancyStatus } from '../../../../generated/prisma/enums.js';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  unitNumber: string;

  @IsNumber()
  @Min(1)
  area: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsEnum(OccupancyStatus)
  occupancyStatus?: OccupancyStatus;

  @IsNumber()
  @Min(0)
  monthlyRent: number;
}
