import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './api/auth/auth.module.js';
import { BuildingsModule } from './api/buildings/buildings.module.js';
import { FloorsModule } from './api/floors/floors.module.js';
import { UnitsModule } from './api/units/units.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BuildingsModule,
    FloorsModule,
    UnitsModule,
  ],
})
export class AppModule {}
