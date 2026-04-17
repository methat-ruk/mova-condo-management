import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateVisitorDto } from './dto/create-visitor.dto.js';

const VISITOR_SELECT = {
  id: true,
  name: true,
  phone: true,
  purpose: true,
  vehiclePlate: true,
  groupSize: true,
  isAutoExpired: true,
  checkInAt: true,
  checkOutAt: true,
  unitId: true,
  unit: {
    select: { unitNumber: true, floor: { select: { floorNumber: true } } },
  },
  residentId: true,
  resident: {
    select: { id: true, user: { select: { firstName: true, lastName: true } } },
  },
  recordedById: true,
  recordedBy: { select: { firstName: true, lastName: true, role: true } },
  checkedOutById: true,
  checkedOutBy: { select: { firstName: true, lastName: true, role: true } },
  createdAt: true,
} as const;

@Injectable()
export class VisitorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, date, page = 1, limit = 50 } = params;

    const where: Record<string, unknown> = {};

    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { unit: { unitNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status === 'IN') {
      where['checkOutAt'] = null;
    } else if (status === 'OUT') {
      where['checkOutAt'] = { not: null };
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where['checkInAt'] = { gte: start, lte: end };
    }

    const [data, total] = await Promise.all([
      this.prisma.visitor.findMany({
        where,
        select: VISITOR_SELECT,
        orderBy: { checkInAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.visitor.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id },
      select: VISITOR_SELECT,
    });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return visitor;
  }

  checkIn(dto: CreateVisitorDto, recordedById: string) {
    return this.prisma.visitor.create({
      data: { ...dto, recordedById },
      select: VISITOR_SELECT,
    });
  }

  async expireStaleVisitors() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.visitor.updateMany({
      where: { checkOutAt: null, checkInAt: { lt: cutoff } },
      data: { checkOutAt: new Date(), isAutoExpired: true },
    });
    return result.count;
  }

  async checkOut(id: string, checkedOutById: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return this.prisma.visitor.update({
      where: { id },
      data: { checkOutAt: new Date(), checkedOutById },
      select: VISITOR_SELECT,
    });
  }
}
