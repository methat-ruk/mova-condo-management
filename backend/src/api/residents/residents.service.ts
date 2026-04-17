import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OccupancyStatus,
  ResidentStatus,
  ResidentType,
} from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto.js';
import type { CreateFamilyMemberDto } from './dto/create-family-member.dto.js';
import type { CreateResidentDto } from './dto/create-resident.dto.js';
import type { MoveOutDto } from './dto/move-out.dto.js';
import type { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto.js';
import type { UpdateFamilyMemberDto } from './dto/update-family-member.dto.js';
import type { UpdateResidentDto } from './dto/update-resident.dto.js';

const residentInclude = {
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  unit: {
    select: {
      id: true,
      unitNumber: true,
      floor: { select: { id: true, floorNumber: true } },
    },
  },
  familyMembers: { orderBy: { createdAt: 'asc' as const } },
  emergencyContacts: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class ResidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    status?: ResidentStatus;
    residentType?: ResidentType;
    unitId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      status,
      residentType,
      unitId,
      search,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(residentType && { residentType }),
      ...(unitId && { unitId }),
      ...(search && {
        OR: [
          {
            user: {
              firstName: { contains: search, mode: 'insensitive' as const },
            },
          },
          {
            user: {
              lastName: { contains: search, mode: 'insensitive' as const },
            },
          },
          {
            user: { email: { contains: search, mode: 'insensitive' as const } },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.resident.findMany({
        where,
        include: residentInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.resident.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { id },
      include: residentInclude,
    });
    if (!resident) throw new NotFoundException('Resident not found');
    return resident;
  }

  async create(dto: CreateResidentDto) {
    const [user, unit] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
      this.prisma.unit.findUnique({ where: { id: dto.unitId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!unit) throw new NotFoundException('Unit not found');

    const resident = await this.prisma.resident.create({
      data: {
        userId: dto.userId,
        unitId: dto.unitId,
        residentType: dto.residentType,
        moveInDate: new Date(dto.moveInDate),
        note: dto.note,
      },
      include: residentInclude,
    });

    await this.prisma.unit.update({
      where: { id: dto.unitId },
      data: { occupancyStatus: OccupancyStatus.OCCUPIED },
    });

    return resident;
  }

  async update(id: string, dto: UpdateResidentDto) {
    const resident = await this.prisma.resident.findUnique({ where: { id } });
    if (!resident) throw new NotFoundException('Resident not found');
    if (resident.status === ResidentStatus.INACTIVE)
      throw new BadRequestException('Cannot update an inactive resident');

    return this.prisma.resident.update({
      where: { id },
      data: dto,
      include: residentInclude,
    });
  }

  async moveOut(id: string, dto: MoveOutDto) {
    const resident = await this.prisma.resident.findUnique({ where: { id } });
    if (!resident) throw new NotFoundException('Resident not found');
    if (resident.status === ResidentStatus.INACTIVE)
      throw new BadRequestException('Resident has already moved out');

    const moveOutDate = dto.moveOutDate
      ? new Date(dto.moveOutDate)
      : new Date();

    await this.prisma.resident.update({
      where: { id },
      data: { status: ResidentStatus.INACTIVE, moveOutDate },
    });

    const activeCount = await this.prisma.resident.count({
      where: { unitId: resident.unitId, status: ResidentStatus.ACTIVE },
    });

    if (activeCount === 0) {
      await this.prisma.unit.update({
        where: { id: resident.unitId },
        data: { occupancyStatus: OccupancyStatus.AVAILABLE },
      });
    }

    return this.findOne(id);
  }

  // Family Members

  async addFamilyMember(residentId: string, dto: CreateFamilyMemberDto) {
    await this.assertResidentExists(residentId);
    return this.prisma.familyMember.create({ data: { residentId, ...dto } });
  }

  async updateFamilyMember(
    residentId: string,
    familyMemberId: string,
    dto: UpdateFamilyMemberDto,
  ) {
    await this.assertFamilyMemberBelongsTo(residentId, familyMemberId);
    return this.prisma.familyMember.update({
      where: { id: familyMemberId },
      data: dto,
    });
  }

  async removeFamilyMember(residentId: string, familyMemberId: string) {
    await this.assertFamilyMemberBelongsTo(residentId, familyMemberId);
    return this.prisma.familyMember.delete({ where: { id: familyMemberId } });
  }

  // Emergency Contacts

  async addEmergencyContact(
    residentId: string,
    dto: CreateEmergencyContactDto,
  ) {
    await this.assertResidentExists(residentId);
    return this.prisma.emergencyContact.create({
      data: { residentId, ...dto },
    });
  }

  async updateEmergencyContact(
    residentId: string,
    contactId: string,
    dto: UpdateEmergencyContactDto,
  ) {
    await this.assertEmergencyContactBelongsTo(residentId, contactId);
    return this.prisma.emergencyContact.update({
      where: { id: contactId },
      data: dto,
    });
  }

  async removeEmergencyContact(residentId: string, contactId: string) {
    await this.assertEmergencyContactBelongsTo(residentId, contactId);
    return this.prisma.emergencyContact.delete({ where: { id: contactId } });
  }

  // Private helpers

  private async assertResidentExists(residentId: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
    });
    if (!resident) throw new NotFoundException('Resident not found');
  }

  private async assertFamilyMemberBelongsTo(
    residentId: string,
    familyMemberId: string,
  ) {
    const member = await this.prisma.familyMember.findUnique({
      where: { id: familyMemberId },
    });
    if (!member || member.residentId !== residentId)
      throw new NotFoundException('Family member not found');
  }

  private async assertEmergencyContactBelongsTo(
    residentId: string,
    contactId: string,
  ) {
    const contact = await this.prisma.emergencyContact.findUnique({
      where: { id: contactId },
    });
    if (!contact || contact.residentId !== residentId)
      throw new NotFoundException('Emergency contact not found');
  }
}
