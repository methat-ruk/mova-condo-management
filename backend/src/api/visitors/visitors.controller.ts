import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateVisitorDto } from './dto/create-visitor.dto.js';
import { VisitorsService } from './visitors.service.js';

@UseGuards(JwtAuthGuard)
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.visitorsService.findAll({
      search,
      status,
      date,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitorsService.findOne(id);
  }

  @Post()
  checkIn(
    @Body() dto: CreateVisitorDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.visitorsService.checkIn(dto, req.user.id);
  }

  @Patch(':id/checkout')
  @HttpCode(HttpStatus.OK)
  checkOut(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.visitorsService.checkOut(id, req.user.id);
  }
}
