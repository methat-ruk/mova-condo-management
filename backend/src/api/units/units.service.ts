import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateUnitDto } from './dto/create-unit.dto.js';
import type { UpdateUnitDto } from './dto/update-unit.dto.js';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.unit.findMany({
      include: {
        floor: { select: { id: true, floorNumber: true } },
      },
      orderBy: [{ floor: { floorNumber: 'asc' } }, { unitNumber: 'asc' }],
    });
  }

  async findByFloor(floorId: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id: floorId },
    });
    if (!floor) throw new NotFoundException('Floor not found');

    return this.prisma.unit.findMany({
      where: { floorId },
      orderBy: { unitNumber: 'asc' },
    });
  }

  async create(floorId: string, dto: CreateUnitDto) {
    const floor = await this.prisma.floor.findUnique({
      where: { id: floorId },
    });
    if (!floor) throw new NotFoundException('Floor not found');

    const existing = await this.prisma.unit.findUnique({
      where: { floorId_unitNumber: { floorId, unitNumber: dto.unitNumber } },
    });
    if (existing)
      throw new ConflictException(
        `Unit ${dto.unitNumber} already exists on this floor`,
      );

    return this.prisma.unit.create({ data: { floorId, ...dto } });
  }

  async update(id: string, dto: UpdateUnitDto) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    return this.prisma.unit.delete({ where: { id } });
  }
}
