import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VisitorsService } from './visitors.service.js';

@Injectable()
export class VisitorsScheduler {
  private readonly logger = new Logger(VisitorsScheduler.name);

  constructor(private readonly visitorsService: VisitorsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleExpireStaleVisitors() {
    const count = await this.visitorsService.expireStaleVisitors();
    if (count > 0) {
      this.logger.log(`Auto-expired ${count} stale visitor record(s)`);
    }
  }
}
