import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEmergencyContactDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  relationship!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
}
