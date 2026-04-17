import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { UpdateBuildingDto } from './dto/update-building.dto.js';
import type { QueryBuildingDto } from './dto/query-building.dto.js';

@Injectable()
export class BuildingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryBuildingDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.building.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { floors: true } } },
      }),
      this.prisma.building.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, dto: UpdateBuildingDto) {
    const building = await this.prisma.building.findUnique({ where: { id } });
    if (!building) throw new NotFoundException('Building not found');
    return this.prisma.building.update({ where: { id }, data: dto });
  }
}
