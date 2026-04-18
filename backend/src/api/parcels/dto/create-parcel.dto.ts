import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateParcelDto {
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsUUID()
  unitId!: string;

  @IsOptional()
  @IsUUID()
  residentId?: string;
}
