import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  MaintenanceCategory,
  MaintenanceStatus,
} from '../../../../generated/prisma/enums.js';

export class CreateTicketDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsEnum(MaintenanceCategory as object)
  category!: MaintenanceCategory;

  @IsUUID()
  unitId!: string;

  @IsOptional()
  @IsUUID()
  residentId?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus as object)
  status?: MaintenanceStatus;
}
