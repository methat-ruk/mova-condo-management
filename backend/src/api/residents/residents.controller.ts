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
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ResidentStatus,
  ResidentType,
} from '../../../generated/prisma/enums.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto.js';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto.js';
import { CreateResidentDto } from './dto/create-resident.dto.js';
import { MoveOutDto } from './dto/move-out.dto.js';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto.js';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto.js';
import { UpdateResidentDto } from './dto/update-resident.dto.js';
import { ResidentsService } from './residents.service.js';

@Controller('residents')
@UseGuards(JwtAuthGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  findAll(
    @Query('status') status?: ResidentStatus,
    @Query('residentType') residentType?: ResidentType,
    @Query('unitId') unitId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.residentsService.findAll({
      status,
      residentType,
      unitId,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.residentsService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreateResidentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.residentsService.create(dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.residentsService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateResidentDto) {
    return this.residentsService.update(id, dto);
  }

  @Patch(':id/move-out')
  moveOut(@Param('id') id: string, @Body() dto: MoveOutDto) {
    return this.residentsService.moveOut(id, dto);
  }

  // Family Members

  @Post(':id/family-members')
  addFamilyMember(@Param('id') id: string, @Body() dto: CreateFamilyMemberDto) {
    return this.residentsService.addFamilyMember(id, dto);
  }

  @Patch(':id/family-members/:fid')
  updateFamilyMember(
    @Param('id') id: string,
    @Param('fid') fid: string,
    @Body() dto: UpdateFamilyMemberDto,
  ) {
    return this.residentsService.updateFamilyMember(id, fid, dto);
  }

  @Delete(':id/family-members/:fid')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFamilyMember(@Param('id') id: string, @Param('fid') fid: string) {
    return this.residentsService.removeFamilyMember(id, fid);
  }

  // Emergency Contacts

  @Post(':id/emergency-contacts')
  addEmergencyContact(
    @Param('id') id: string,
    @Body() dto: CreateEmergencyContactDto,
  ) {
    return this.residentsService.addEmergencyContact(id, dto);
  }

  @Patch(':id/emergency-contacts/:cid')
  updateEmergencyContact(
    @Param('id') id: string,
    @Param('cid') cid: string,
    @Body() dto: UpdateEmergencyContactDto,
  ) {
    return this.residentsService.updateEmergencyContact(id, cid, dto);
  }

  @Delete(':id/emergency-contacts/:cid')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEmergencyContact(@Param('id') id: string, @Param('cid') cid: string) {
    return this.residentsService.removeEmergencyContact(id, cid);
  }
}
