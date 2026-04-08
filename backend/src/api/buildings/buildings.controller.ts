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
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BuildingsService } from './buildings.service.js';
import { CreateBuildingDto } from './dto/create-building.dto.js';
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buildingsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBuildingDto) {
    return this.buildingsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    return this.buildingsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.buildingsService.remove(id);
  }
}
