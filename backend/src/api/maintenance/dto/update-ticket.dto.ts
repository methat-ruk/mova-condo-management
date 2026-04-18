import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MaintenanceStatus } from '../../../../generated/prisma/enums.js';

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(MaintenanceStatus as object)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsUUID()
  assignedToId?: string | null;

  @IsOptional()
  @IsString()
  note?: string;
}
