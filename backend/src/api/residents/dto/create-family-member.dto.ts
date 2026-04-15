import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFamilyMemberDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  relationship!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
