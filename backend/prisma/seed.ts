import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  UserRole,
  ResidentType,
  OccupancyStatus,
} from '../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  // Staff
  { email: 'admin@condo.com',   password: 'Admin1234',    firstName: 'Admin',    lastName: 'User',       role: UserRole.ADMIN },
  { email: 'manager@condo.com', password: 'Manager1234',  firstName: 'Property', lastName: 'Manager',    role: UserRole.PROPERTY_MANAGER },
  { email: 'staff@condo.com',   password: 'Staff1234',    firstName: 'Staff',    lastName: 'Member',     role: UserRole.STAFF },
  // Residents
  { email: 'john.doe@condo.com',     password: 'Resident1234', firstName: 'John',     lastName: 'Doe',        role: UserRole.RESIDENT },
  { email: 'sarah.smith@condo.com',  password: 'Resident1234', firstName: 'Sarah',    lastName: 'Smith',      role: UserRole.RESIDENT },
  { email: 'wichai.th@condo.com',    password: 'Resident1234', firstName: 'วิชัย',   lastName: 'ศรีสมบูรณ์', role: UserRole.RESIDENT },
  { email: 'malee.th@condo.com',     password: 'Resident1234', firstName: 'มาลี',    lastName: 'จันทร์งาม',  role: UserRole.RESIDENT },
  { email: 'somchai.th@condo.com',   password: 'Resident1234', firstName: 'สมชาย',   lastName: 'ใจดี',       role: UserRole.RESIDENT },
  { email: 'david.lee@condo.com',    password: 'Resident1234', firstName: 'David',    lastName: 'Lee',        role: UserRole.RESIDENT },
  { email: 'nattaya.th@condo.com',   password: 'Resident1234', firstName: 'ณัฐยา',   lastName: 'พรหมสุวรรณ', role: UserRole.RESIDENT },
] as const;

async function main() {
  // ── Users ─────────────────────────────────────────────────────────────────
  console.log('Seeding users...');
  const userIds: Record<string, string> = {};

  for (const seed of SEED_USERS) {
    const hashed = await bcrypt.hash(seed.password, 10);
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        email: seed.email,
        password: hashed,
        firstName: seed.firstName,
        lastName: seed.lastName,
        role: seed.role,
      },
    });
    userIds[seed.email] = user.id;
    console.log(`  ✓ ${user.role.padEnd(16)} ${user.email}`);
  }

  // ── Building ──────────────────────────────────────────────────────────────
  console.log('Seeding building...');
  const building = await prisma.building.upsert({
    where: { id: 'seed-building-1' },
    update: {},
    create: {
      id: 'seed-building-1',
      name: 'Mova Condo',
      address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
      totalFloors: 5,
      description: 'คอนโดมิเนียมใจกลางเมือง ใกล้รถไฟฟ้า BTS อโศก',
    },
  });
  console.log(`  ✓ ${building.name}`);

  // ── Floors ────────────────────────────────────────────────────────────────
  console.log('Seeding floors...');
  const floorIds: string[] = [];

  for (let f = 1; f <= 5; f++) {
    const floor = await prisma.floor.upsert({
      where: { buildingId_floorNumber: { buildingId: building.id, floorNumber: f } },
      update: {},
      create: { buildingId: building.id, floorNumber: f },
    });
    floorIds.push(floor.id);
    console.log(`  ✓ Floor ${f}`);
  }

  // ── Units (4 per floor: S / M / L / XL) ──────────────────────────────────
  console.log('Seeding units...');

  const unitDefs = [
    { suffix: '01', area: 25, bedrooms: 1, bathrooms: 1, rent: 8000 },
    { suffix: '02', area: 35, bedrooms: 1, bathrooms: 1, rent: 11000 },
    { suffix: '03', area: 50, bedrooms: 2, bathrooms: 1, rent: 15000 },
    { suffix: '04', area: 70, bedrooms: 2, bathrooms: 2, rent: 20000 },
  ];

  // unitIds[floorIndex][unitDefIndex] = unitId
  const unitIds: string[][] = [];

  for (let fi = 0; fi < floorIds.length; fi++) {
    const row: string[] = [];
    for (const def of unitDefs) {
      const unitNumber = `${fi + 1}${def.suffix}`;
      const unit = await prisma.unit.upsert({
        where: { floorId_unitNumber: { floorId: floorIds[fi], unitNumber } },
        update: {},
        create: {
          floorId: floorIds[fi],
          unitNumber,
          area: def.area,
          bedrooms: def.bedrooms,
          bathrooms: def.bathrooms,
          monthlyRent: def.rent,
          occupancyStatus: OccupancyStatus.AVAILABLE,
        },
      });
      row.push(unit.id);
    }
    unitIds.push(row);
    console.log(`  ✓ Floor ${fi + 1}: ${fi + 1}01 / ${fi + 1}02 / ${fi + 1}03 / ${fi + 1}04`);
  }

  // ── Residents ─────────────────────────────────────────────────────────────
  console.log('Seeding residents...');

  // [email, floorIndex, unitIndex, type, moveInDate, note]
  const residentDefs: [string, number, number, ResidentType, Date, string | null][] = [
    ['john.doe@condo.com',    0, 0, ResidentType.OWNER,  new Date('2023-06-01'), 'เจ้าของห้อง ชั้น 1'],
    ['sarah.smith@condo.com', 0, 1, ResidentType.TENANT, new Date('2024-01-10'), null],
    ['wichai.th@condo.com',   1, 2, ResidentType.OWNER,  new Date('2023-09-15'), 'ซื้อห้องใหญ่ 2 ห้องนอน'],
    ['malee.th@condo.com',    1, 0, ResidentType.TENANT, new Date('2024-03-01'), null],
    ['somchai.th@condo.com',  2, 3, ResidentType.OWNER,  new Date('2022-11-20'), 'ห้องใหญ่สุด XL'],
    ['david.lee@condo.com',   3, 1, ResidentType.TENANT, new Date('2024-07-15'), 'ชาวต่างชาติ สัญญา 1 ปี'],
    ['nattaya.th@condo.com',  4, 2, ResidentType.OWNER,  new Date('2023-01-05'), null],
    // john.doe มีห้องที่ 2 (owner หลายห้อง)
    ['john.doe@condo.com',    3, 0, ResidentType.OWNER,  new Date('2023-12-01'), 'ห้องที่ 2 ให้เช่า'],
  ];

  for (const [email, fi, ui, type, moveIn, note] of residentDefs) {
    const userId = userIds[email];
    const unitId = unitIds[fi][ui];
    if (!userId || !unitId) continue;

    const existing = await prisma.resident.findFirst({ where: { userId, unitId } });
    if (existing) {
      console.log(`  – skip  ${email} → unit already seeded`);
      continue;
    }

    await prisma.resident.create({
      data: { userId, unitId, residentType: type, moveInDate: moveIn, note },
    });
    await prisma.unit.update({
      where: { id: unitId },
      data: { occupancyStatus: OccupancyStatus.OCCUPIED },
    });
    console.log(`  ✓ ${type.padEnd(6)} ${email}`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
