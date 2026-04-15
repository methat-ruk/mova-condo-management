import { IsOptional, IsString } from 'class-validator';

export class UpdateFamilyMemberDto {
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
