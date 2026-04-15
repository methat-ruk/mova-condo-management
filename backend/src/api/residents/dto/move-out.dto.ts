import { IsDateString, IsOptional } from 'class-validator';

export class MoveOutDto {
  @IsOptional()
  @IsDateString()
  moveOutDate?: string;
}
