import { IsInt, Min } from 'class-validator';

export class CreateFloorDto {
  @IsInt()
  @Min(1)
  floorNumber!: number;
}
