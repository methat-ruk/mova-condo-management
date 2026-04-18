import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateParcelDto } from './dto/create-parcel.dto.js';

const PARCEL_SELECT = {
  id: true,
  trackingNumber: true,
  carrier: true,
  note: true,
  status: true,
  receivedAt: true,
  claimedAt: true,
  unitId: true,
  unit: {
    select: { unitNumber: true, floor: { select: { floorNumber: true } } },
  },
  residentId: true,
  resident: {
    select: { id: true, user: { select: { firstName: true, lastName: true } } },
  },
  receivedById: true,
  receivedBy: { select: { firstName: true, lastName: true, role: true } },
  claimedById: true,
  claimedBy: { select: { firstName: true, lastName: true, role: true } },
  createdAt: true,
} as const;

@Injectable()
export class ParcelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 50 } = params;

    const where: Record<string, unknown> = {};

    if (search) {
      where['OR'] = [
        {
          trackingNumber: { contains: search, mode: 'insensitive' },
        },
        {
          unit: { unitNumber: { contains: search, mode: 'insensitive' } },
        },
        {
          resident: {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    if (status === 'PENDING') {
      where['status'] = 'PENDING';
    } else if (status === 'CLAIMED') {
      where['status'] = 'CLAIMED';
    }

    const [data, total] = await Promise.all([
      this.prisma.parcel.findMany({
        where,
        select: PARCEL_SELECT,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.parcel.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      select: PARCEL_SELECT,
    });
    if (!parcel) throw new NotFoundException('Parcel not found');
    return parcel;
  }

  create(dto: CreateParcelDto, receivedById: string) {
    return this.prisma.parcel.create({
      data: { ...dto, receivedById },
      select: PARCEL_SELECT,
    });
  }

  async claim(id: string, claimedById: string) {
    const parcel = await this.prisma.parcel.findUnique({ where: { id } });
    if (!parcel) throw new NotFoundException('Parcel not found');
    return this.prisma.parcel.update({
      where: { id },
      data: { status: 'CLAIMED', claimedAt: new Date(), claimedById },
      select: PARCEL_SELECT,
    });
  }
}
