import { IsOptional, IsString } from 'class-validator';

export class UpdateEmergencyContactDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
