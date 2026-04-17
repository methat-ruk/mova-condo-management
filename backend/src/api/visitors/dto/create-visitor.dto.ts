import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateVisitorDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsUUID()
  unitId!: string;

  @IsOptional()
  @IsUUID()
  residentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  groupSize?: number;
}
