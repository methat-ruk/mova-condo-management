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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { QueryExpenseSummaryDto } from './dto/query-expense-summary.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { MaintenanceService } from './maintenance.service.js';

@UseGuards(JwtAuthGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.maintenanceService.findAll({
      search,
      status,
      category,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('expenses/summary')
  getExpenseSummary(@Query() query: QueryExpenseSummaryDto) {
    return this.maintenanceService.getExpenseSummary(query);
  }

  @Get('expenses/export-csv')
  async exportExpenseCsv(@Query() query: QueryExpenseSummaryDto) {
    return this.maintenanceService.exportExpenseCsv(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreateTicketDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.maintenanceService.create(dto, req.user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.maintenanceService.update(id, dto, req.user.id);
  }

  @Post(':id/expenses')
  @HttpCode(HttpStatus.OK)
  addExpense(
    @Param('id') id: string,
    @Body() dto: CreateExpenseDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.maintenanceService.addExpense(id, dto, req.user.id);
  }

  @Delete(':ticketId/expenses/:expenseId')
  @HttpCode(HttpStatus.OK)
  removeExpense(
    @Param('ticketId') ticketId: string,
    @Param('expenseId') expenseId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.maintenanceService.removeExpense(
      ticketId,
      expenseId,
      req.user.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(id);
  }
}
