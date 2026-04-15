import { Injectable, NotFoundException } from '@nestjs/common';
import { AnnouncementStatus } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAnnouncementDto } from './dto/create-announcement.dto.js';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto.js';

const announcementInclude = {
  createdBy: {
    select: { id: true, firstName: true, lastName: true, role: true },
  },
} as const;

/** An announcement is "visible" when status=ACTIVE and not past expiredAt */
function activeWhere() {
  return {
    status: AnnouncementStatus.ACTIVE,
    OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }],
  };
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List ────────────────────────────────────────────────────────────────

  async findAll(query: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status === 'VISIBLE') {
      Object.assign(where, activeWhere());
    } else if (status) {
      where['status'] = status;
    }

    if (search) {
      const q = search.trim();
      where['OR'] = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: announcementInclude,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ── Unread count for a user ─────────────────────────────────────────────

  async unreadCount(userId: string) {
    const activeCount = await this.prisma.announcement.count({
      where: activeWhere(),
    });

    const readCount = await this.prisma.announcementRead.count({
      where: {
        userId,
        announcement: activeWhere(),
      },
    });

    return { unread: activeCount - readCount };
  }

  // ── Detail ───────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: announcementInclude,
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  // ── Mark as read ─────────────────────────────────────────────────────────

  async markRead(announcementId: string, userId: string) {
    await this.prisma.announcementRead.upsert({
      where: { userId_announcementId: { userId, announcementId } },
      update: {},
      create: { userId, announcementId },
    });
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateAnnouncementDto, createdById: string) {
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        isPinned: dto.isPinned ?? false,
        status: dto.status ?? AnnouncementStatus.ACTIVE,
        expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : null,
        createdById,
      },
      include: announcementInclude,
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateAnnouncementDto) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Announcement not found');

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.expiredAt !== undefined && {
          expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : null,
        }),
      },
      include: announcementInclude,
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(id: string) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Announcement not found');
    await this.prisma.announcement.delete({ where: { id } });
  }
}
