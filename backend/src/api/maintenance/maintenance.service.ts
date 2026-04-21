import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { MaintenanceCategory } from '../../../generated/prisma/enums.js';
import { MaintenanceStatus } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateExpenseDto } from './dto/create-expense.dto.js';
import type { CreateTicketDto } from './dto/create-ticket.dto.js';
import type { QueryExpenseSummaryDto } from './dto/query-expense-summary.dto.js';
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
  expenses: {
    select: { amount: true },
  },
} as const;

const TICKET_DETAIL_SELECT = {
  ...TICKET_SELECT,
  expenses: {
    select: {
      id: true,
      title: true,
      amount: true,
      note: true,
      spentAt: true,
      createdAt: true,
      createdBy: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
    orderBy: [
      { spentAt: 'desc' as Prisma.SortOrder },
      { createdAt: 'desc' as Prisma.SortOrder },
    ],
  },
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
};

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  private getSummaryRange(
    year: number,
    month?: number,
    day?: number,
    periodType: 'daily' | 'monthly' | 'yearly' = 'monthly',
  ): {
    startDate: Date;
    endDate: Date;
  } {
    if (periodType === 'daily' && month && day) {
      return {
        startDate: new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)),
        endDate: new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0)),
      };
    }

    if (periodType === 'monthly' && month) {
      return {
        startDate: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
        endDate: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
      };
    }

    return {
      startDate: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
      endDate: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)),
    };
  }

  private async getExpensesForPeriod(query: QueryExpenseSummaryDto) {
    const periodType = query.periodType ?? (query.month ? 'monthly' : 'yearly');
    const { startDate, endDate } = this.getSummaryRange(
      query.year,
      query.month,
      query.day,
      periodType,
    );

    const where: Prisma.MaintenanceExpenseWhereInput = {
      spentAt: {
        gte: startDate,
        lt: endDate,
      },
    };

    const expenses = await this.prisma.maintenanceExpense.findMany({
      where,
      select: {
        id: true,
        title: true,
        amount: true,
        note: true,
        spentAt: true,
        ticketId: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        ticket: {
          select: {
            id: true,
            title: true,
            category: true,
            unit: {
              select: {
                unitNumber: true,
                floor: {
                  select: {
                    floorNumber: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ spentAt: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      expenses,
      periodType,
      startDate,
      endDate,
    };
  }

  private mapExpenseTotal<T>(ticket: T): T & { expenseTotal: number } {
    const ticketWithExpenses = ticket as T & {
      expenses?: { amount: unknown }[];
    };
    const expenseTotal = (ticketWithExpenses.expenses ?? []).reduce(
      (sum, expense) => {
        const amount = Number(expense.amount ?? 0);
        return sum + amount;
      },
      0,
    );

    return {
      ...ticket,
      expenseTotal,
    };
  }

  private async getTicketOrThrow(id: string) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  private async getTicketDetailOrThrow(id: string) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
      select: TICKET_DETAIL_SELECT,
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.mapExpenseTotal(ticket);
  }

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

    const [rawData, total] = await Promise.all([
      this.prisma.maintenanceTicket.findMany({
        where,
        select: TICKET_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.maintenanceTicket.count({ where }),
    ]);

    const data = rawData.map((ticket) => this.mapExpenseTotal(ticket));

    return { data, total, page, limit };
  }

  async getExpenseSummary(query: QueryExpenseSummaryDto) {
    const { year, month, day } = query;
    const { expenses, periodType, startDate, endDate } =
      await this.getExpensesForPeriod(query);

    const [groupedByCategory] = await Promise.all([
      this.prisma.maintenanceExpense.groupBy({
        by: ['ticketId'],
        where: {
          spentAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const totalAmount = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );
    const expenseCount = expenses.length;
    const ticketCount = new Set(expenses.map((expense) => expense.ticketId))
      .size;

    const categoryMap = new Map<
      MaintenanceCategory,
      {
        category: MaintenanceCategory;
        totalAmount: number;
        expenseCount: number;
        ticketCount: number;
      }
    >();

    for (const category of Object.values(MaintenanceCategory)) {
      categoryMap.set(category, {
        category,
        totalAmount: 0,
        expenseCount: 0,
        ticketCount: 0,
      });
    }

    const categoryTicketMap = new Map<MaintenanceCategory, Set<string>>();

    for (const expense of expenses) {
      const current = categoryMap.get(expense.ticket.category);

      if (!current) {
        continue;
      }

      current.totalAmount += Number(expense.amount);
      current.expenseCount += 1;

      if (!categoryTicketMap.has(expense.ticket.category)) {
        categoryTicketMap.set(expense.ticket.category, new Set<string>());
      }

      categoryTicketMap.get(expense.ticket.category)?.add(expense.ticketId);
    }

    for (const [category, tickets] of categoryTicketMap.entries()) {
      const current = categoryMap.get(category);

      if (current) {
        current.ticketCount = tickets.size;
      }
    }

    const topTickets = groupedByCategory
      .map((group) => {
        const sampleExpense = expenses.find(
          (expense) => expense.ticketId === group.ticketId,
        );

        if (!sampleExpense) {
          return null;
        }

        return {
          ticketId: group.ticketId,
          title: sampleExpense.ticket.title,
          category: sampleExpense.ticket.category,
          unitNumber: sampleExpense.ticket.unit.unitNumber,
          floorNumber: sampleExpense.ticket.unit.floor.floorNumber,
          totalAmount: Number(group._sum.amount ?? 0),
          expenseCount: group._count.id,
        };
      })
      .filter((ticket): ticket is NonNullable<typeof ticket> => ticket !== null)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    const monthlyBreakdown = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      totalAmount: 0,
      expenseCount: 0,
      ticketCount: 0,
    }));

    const dailyBreakdown = month
      ? Array.from(
          { length: new Date(Date.UTC(year, month, 0)).getUTCDate() },
          (_, index) => ({
            day: index + 1,
            totalAmount: 0,
            expenseCount: 0,
            ticketCount: 0,
          }),
        )
      : [];

    if (periodType === 'yearly') {
      const monthlyTicketSets = monthlyBreakdown.map(() => new Set<string>());

      for (const expense of expenses) {
        const expenseMonth = new Date(expense.spentAt).getUTCMonth();
        const current = monthlyBreakdown[expenseMonth];

        current.totalAmount += Number(expense.amount);
        current.expenseCount += 1;
        monthlyTicketSets[expenseMonth].add(expense.ticketId);
      }

      monthlyBreakdown.forEach((entry, index) => {
        entry.ticketCount = monthlyTicketSets[index].size;
      });
    }

    if (periodType === 'monthly' && month) {
      const dailyTicketSets = dailyBreakdown.map(() => new Set<string>());

      for (const expense of expenses) {
        const expenseDay = new Date(expense.spentAt).getUTCDate() - 1;
        const current = dailyBreakdown[expenseDay];

        current.totalAmount += Number(expense.amount);
        current.expenseCount += 1;
        dailyTicketSets[expenseDay].add(expense.ticketId);
      }

      dailyBreakdown.forEach((entry, index) => {
        entry.ticketCount = dailyTicketSets[index].size;
      });
    }

    return {
      period: {
        periodType,
        year,
        month: month ?? null,
        day: day ?? null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalAmount,
      expenseCount,
      ticketCount,
      byCategory: Array.from(categoryMap.values()),
      topTickets,
      monthlyBreakdown: periodType === 'yearly' ? monthlyBreakdown : [],
      dailyBreakdown: periodType === 'monthly' ? dailyBreakdown : [],
      expenseRows: expenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        amount: Number(expense.amount),
        note: expense.note,
        spentAt: expense.spentAt.toISOString(),
        ticketId: expense.ticketId,
        ticketTitle: expense.ticket.title,
        category: expense.ticket.category,
        unitNumber: expense.ticket.unit.unitNumber,
        floorNumber: expense.ticket.unit.floor.floorNumber,
        createdBy: `${expense.createdBy.firstName} ${expense.createdBy.lastName}`,
      })),
    };
  }

  async exportExpenseCsv(query: QueryExpenseSummaryDto) {
    const { expenses, periodType } = await this.getExpensesForPeriod(query);

    const rows = [
      [
        'Period Type',
        'Spent At',
        'Expense Title',
        'Amount',
        'Category',
        'Ticket Title',
        'Floor',
        'Unit',
        'Created By',
        'Note',
      ],
      ...expenses.map((expense) => [
        periodType,
        expense.spentAt.toISOString(),
        expense.title,
        Number(expense.amount).toFixed(2),
        expense.ticket.category,
        expense.ticket.title,
        String(expense.ticket.unit.floor.floorNumber),
        expense.ticket.unit.unitNumber,
        `${expense.createdBy.firstName} ${expense.createdBy.lastName}`,
        expense.note ?? '',
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n');

    return {
      fileName: `maintenance-expenses-${periodType}-${query.year}${query.month ? `-${String(query.month).padStart(2, '0')}` : ''}${query.day ? `-${String(query.day).padStart(2, '0')}` : ''}.csv`,
      content: csv,
    };
  }

  async findOne(id: string) {
    return this.getTicketDetailOrThrow(id);
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
    return this.mapExpenseTotal(ticket);
  }

  async remove(id: string) {
    await this.getTicketOrThrow(id);
    await this.prisma.maintenanceTicket.delete({ where: { id } });
  }

  async update(id: string, dto: UpdateTicketDto, userId: string) {
    const ticket = await this.getTicketOrThrow(id);

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

    return this.mapExpenseTotal(updated);
  }

  async addExpense(ticketId: string, dto: CreateExpenseDto, userId: string) {
    await this.getTicketOrThrow(ticketId);

    await this.prisma.maintenanceExpense.create({
      data: {
        ticketId,
        title: dto.title.trim(),
        amount: dto.amount,
        note: dto.note?.trim() || null,
        spentAt: new Date(dto.spentAt),
        createdById: userId,
      },
    });

    await this.createLog(
      ticketId,
      userId,
      'EXPENSE_ADDED',
      null,
      `${dto.title.trim()} (${dto.amount.toFixed(2)})`,
    );

    return this.getTicketDetailOrThrow(ticketId);
  }

  async removeExpense(ticketId: string, expenseId: string, userId: string) {
    await this.getTicketOrThrow(ticketId);

    const expense = await this.prisma.maintenanceExpense.findFirst({
      where: {
        id: expenseId,
        ticketId,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.prisma.maintenanceExpense.delete({
      where: { id: expense.id },
    });

    await this.createLog(
      ticketId,
      userId,
      'EXPENSE_REMOVED',
      `${expense.title} (${Number(expense.amount).toFixed(2)})`,
      null,
    );

    return this.getTicketDetailOrThrow(ticketId);
  }
}
