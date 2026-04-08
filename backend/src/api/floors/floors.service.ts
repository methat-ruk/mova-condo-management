import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateFloorDto } from './dto/create-floor.dto.js';

@Injectable()
export class FloorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByBuilding(buildingId: string) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });
    if (!building) throw new NotFoundException('Building not found');

    return this.prisma.floor.findMany({
      where: { buildingId },
      orderBy: { floorNumber: 'asc' },
      include: { _count: { select: { units: true } } },
    });
  }

  async findOne(id: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id },
      include: { _count: { select: { units: true } } },
    });
    if (!floor) throw new NotFoundException('Floor not found');
    return floor;
  }

  async create(buildingId: string, dto: CreateFloorDto) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });
    if (!building) throw new NotFoundException('Building not found');

    const existing = await this.prisma.floor.findUnique({
      where: {
        buildingId_floorNumber: { buildingId, floorNumber: dto.floorNumber },
      },
    });
    if (existing)
      throw new ConflictException(`Floor ${dto.floorNumber} already exists`);

    return this.prisma.floor.create({
      data: { buildingId, floorNumber: dto.floorNumber },
    });
  }

  async remove(id: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id },
      include: { _count: { select: { units: true } } },
    });
    if (!floor) throw new NotFoundException('Floor not found');
    if (floor._count.units > 0)
      throw new BadRequestException('Cannot delete floor with existing units');
    return this.prisma.floor.delete({ where: { id } });
  }
}
