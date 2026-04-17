import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BuildingsService } from './buildings.service.js';
import { QueryBuildingDto } from './dto/query-building.dto.js';
import { UpdateBuildingDto } from './dto/update-building.dto.js';

@Controller('buildings')
@UseGuards(JwtAuthGuard)
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  findAll(@Query() query: QueryBuildingDto) {
    return this.buildingsService.findAll(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    return this.buildingsService.update(id, dto);
  }
}
