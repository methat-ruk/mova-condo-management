import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { VisitorsController } from './visitors.controller.js';
import { VisitorsScheduler } from './visitors.scheduler.js';
import { VisitorsService } from './visitors.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [VisitorsController],
  providers: [VisitorsService, VisitorsScheduler],
})
export class VisitorsModule {}
