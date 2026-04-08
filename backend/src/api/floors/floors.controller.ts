import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateFloorDto } from './dto/create-floor.dto.js';
import { FloorsService } from './floors.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class FloorsController {
  constructor(private readonly floorsService: FloorsService) {}

  @Get('buildings/:buildingId/floors')
  findByBuilding(@Param('buildingId') buildingId: string) {
    return this.floorsService.findByBuilding(buildingId);
  }

  @Get('floors/:id')
  findOne(@Param('id') id: string) {
    return this.floorsService.findOne(id);
  }

  @Post('buildings/:buildingId/floors')
  create(@Param('buildingId') buildingId: string, @Body() dto: CreateFloorDto) {
    return this.floorsService.create(buildingId, dto);
  }

  @Delete('floors/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.floorsService.remove(id);
  }
}
