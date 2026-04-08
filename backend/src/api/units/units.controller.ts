import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateUnitDto } from './dto/create-unit.dto.js';
import { UpdateUnitDto } from './dto/update-unit.dto.js';
import { UnitsService } from './units.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get('floors/:floorId/units')
  findByFloor(@Param('floorId') floorId: string) {
    return this.unitsService.findByFloor(floorId);
  }

  @Post('floors/:floorId/units')
  create(@Param('floorId') floorId: string, @Body() dto: CreateUnitDto) {
    return this.unitsService.create(floorId, dto);
  }

  @Patch('units/:id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(id, dto);
  }

  @Delete('units/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }
}
