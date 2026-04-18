import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AnnouncementsModule } from './api/announcements/announcements.module.js';
import { AuthModule } from './api/auth/auth.module.js';
import { BuildingsModule } from './api/buildings/buildings.module.js';
import { FloorsModule } from './api/floors/floors.module.js';
import { ResidentsModule } from './api/residents/residents.module.js';
import { UnitsModule } from './api/units/units.module.js';
import { VisitorsModule } from './api/visitors/visitors.module.js';
import { ParcelsModule } from './api/parcels/parcels.module.js';
import { MaintenanceModule } from './api/maintenance/maintenance.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    BuildingsModule,
    FloorsModule,
    UnitsModule,
    ResidentsModule,
    AnnouncementsModule,
    VisitorsModule,
    ParcelsModule,
    MaintenanceModule,
  ],
})
export class AppModule {}
