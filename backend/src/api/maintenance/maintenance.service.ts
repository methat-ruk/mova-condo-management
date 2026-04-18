import { Injectable, NotFoundException } from '@nestjs/common';
import { MaintenanceStatus } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateTicketDto } from './dto/create-ticket.dto.js';
import type { UpdateTicketDto } from './dto/update-ticket.dto.js';

const TICKET_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  status: true,
  note: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  unitId: true,
  unit: {
    select: { unitNumber: true, floor: { select: { floorNumber: true } } },
  },
  residentId: true,
  resident: {
    select: { id: true, user: { select: { firstName: true, lastName: true } } },
  },
  assignedToId: true,
  assignedTo: {
    select: { id: true, firstName: true, lastName: true, role: true },
  },
  reportedById: true,
  reportedBy: { select: { firstName: true, lastName: true, role: true } },
} as const;

const TICKET_DETAIL_SELECT = {
  ...TICKET_SELECT,
  logs: {
    select: {
      id: true,
      action: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
      user: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async createLog(
    ticketId: string,
    userId: string,
    action: string,
    oldValue?: string | null,
    newValue?: string | null,
  ) {
    await this.prisma.maintenanceTicketLog.create({
      data: { ticketId, userId, action, oldValue, newValue },
    });
  }

  async findAll(params: {
    search?: string;
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, category, page = 1, limit = 20 } = params;

    const where: Record<string, unknown> = {};

    if (search) {
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { unit: { unitNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status in MaintenanceStatus) {
      where['status'] = status;
    }

    if (category) {
      where['category'] = category;
    }

    const [data, total] = await Promise.all([
      this.prisma.maintenanceTicket.findMany({
        where,
        select: TICKET_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.maintenanceTicket.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
      select: TICKET_DETAIL_SELECT,
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async create(dto: CreateTicketDto, reportedById: string) {
    const ticket = await this.prisma.maintenanceTicket.create({
      data: { ...dto, reportedById },
      select: TICKET_SELECT,
    });
    await this.createLog(
      ticket.id,
      reportedById,
      'CREATED',
      null,
      ticket.status,
    );
    return ticket;
  }

  async remove(id: string) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    await this.prisma.maintenanceTicket.delete({ where: { id } });
  }

  async update(id: string, dto: UpdateTicketDto, userId: string) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const resolvedAt =
      dto.status === MaintenanceStatus.RESOLVED &&
      ticket.status !== MaintenanceStatus.RESOLVED
        ? new Date()
        : undefined;

    const updated = await this.prisma.maintenanceTicket.update({
      where: { id },
      data: {
        ...dto,
        ...(resolvedAt ? { resolvedAt } : {}),
      },
      select: TICKET_SELECT,
    });

    const logs: Promise<void>[] = [];

    if (dto.status && dto.status !== ticket.status) {
      logs.push(
        this.createLog(id, userId, 'STATUS_CHANGED', ticket.status, dto.status),
      );
    }

    if ('assignedToId' in dto) {
      const oldId = ticket.assignedToId ?? null;
      const newId = dto.assignedToId ?? null;
      if (oldId !== newId) {
        const action = newId
          ? oldId
            ? 'REASSIGNED'
            : 'ASSIGNED'
          : 'UNASSIGNED';
        const [oldUser, newUser] = await Promise.all([
          oldId
            ? this.prisma.user.findUnique({
                where: { id: oldId },
                select: { firstName: true, lastName: true },
              })
            : Promise.resolve(null),
          newId
            ? this.prisma.user.findUnique({
                where: { id: newId },
                select: { firstName: true, lastName: true },
              })
            : Promise.resolve(null),
        ]);
        const oldName = oldUser
          ? `${oldUser.firstName} ${oldUser.lastName}`
          : null;
        const newName = newUser
          ? `${newUser.firstName} ${newUser.lastName}`
          : null;
        logs.push(this.createLog(id, userId, action, oldName, newName));
      }
    }

    if ('note' in dto && (dto.note ?? null) !== (ticket.note ?? null)) {
      logs.push(
        this.createLog(
          id,
          userId,
          'NOTE_UPDATED',
          ticket.note ?? null,
          dto.note ?? null,
        ),
      );
    }

    await Promise.all(logs);

    return updated;
  }
}
