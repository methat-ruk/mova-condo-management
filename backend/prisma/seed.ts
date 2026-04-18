import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  UserRole,
  ResidentType,
  OccupancyStatus,
  AnnouncementStatus,
} from '../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

type VisitorSeed = {
  id: string;
  name: string;
  phone?: string;
  purpose?: string;
  vehiclePlate?: string;
  groupSize?: number;
  unitKey: [number, number]; // [floorIndex, unitDefIndex]
  residentEmail?: string;
  checkInAt: Date;
  checkOutAt?: Date;
  checkedOutByEmail?: string;
  isAutoExpired?: boolean;
};

const SEED_USERS = [
  // Staff
  {
    email: 'admin@movacondo.co.th',
    password: 'Admin1234',
    firstName: 'ธนากร',
    lastName: 'พงษ์ศิริ',
    role: UserRole.ADMIN,
  },
  {
    email: 'manager@movacondo.co.th',
    password: 'Manager1234',
    firstName: 'วิภา',
    lastName: 'พรหมมา',
    role: UserRole.JURISTIC,
  },
  {
    email: 'maintenance@movacondo.co.th',
    password: 'Maintenance1234',
    firstName: 'ประสิทธิ์',
    lastName: 'สุขใจ',
    role: UserRole.MAINTENANCE,
  },
  {
    email: 'guard@movacondo.co.th',
    password: 'Guard1234',
    firstName: 'วิเชียร',
    lastName: 'ทองคำ',
    role: UserRole.GUARD,
  },
  // Residents (batch 1)
  {
    email: 'john.doe@gmail.com',
    password: 'Resident1234',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.RESIDENT,
  },
  {
    email: 'sarah.smith@hotmail.com',
    password: 'Resident1234',
    firstName: 'Sarah',
    lastName: 'Smith',
    role: UserRole.RESIDENT,
  },
  {
    email: 'wichai.srisomboon@gmail.com',
    password: 'Resident1234',
    firstName: 'วิชัย',
    lastName: 'ศรีสมบูรณ์',
    role: UserRole.RESIDENT,
  },
  {
    email: 'malee.jangam@gmail.com',
    password: 'Resident1234',
    firstName: 'มาลี',
    lastName: 'จันทร์งาม',
    role: UserRole.RESIDENT,
  },
  {
    email: 'somchai.jaidee@gmail.com',
    password: 'Resident1234',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    role: UserRole.RESIDENT,
  },
  {
    email: 'david.lee@outlook.com',
    password: 'Resident1234',
    firstName: 'David',
    lastName: 'Lee',
    role: UserRole.RESIDENT,
  },
  {
    email: 'nattaya.prom@gmail.com',
    password: 'Resident1234',
    firstName: 'ณัฐยา',
    lastName: 'พรหมสุวรรณ',
    role: UserRole.RESIDENT,
  },
  {
    email: 'anan.sooksan@gmail.com',
    password: 'Resident1234',
    firstName: 'อนันต์',
    lastName: 'สุขสันต์',
    role: UserRole.RESIDENT,
  },
  {
    email: 'pranee.wongsiri@gmail.com',
    password: 'Resident1234',
    firstName: 'ปราณี',
    lastName: 'วงศ์ศิริ',
    role: UserRole.RESIDENT,
  },
  {
    email: 'krit.limpichai@gmail.com',
    password: 'Resident1234',
    firstName: 'กฤต',
    lastName: 'ลิมปิชัย',
    role: UserRole.RESIDENT,
  },
  {
    email: 'pim.thanakul@gmail.com',
    password: 'Resident1234',
    firstName: 'พิม',
    lastName: 'ธนะกูล',
    role: UserRole.RESIDENT,
  },
  {
    email: 'chaiyot.boonmak@gmail.com',
    password: 'Resident1234',
    firstName: 'ชัยยศ',
    lastName: 'บุญมาก',
    role: UserRole.RESIDENT,
  },
  {
    email: 'lisa.wong@gmail.com',
    password: 'Resident1234',
    firstName: 'Lisa',
    lastName: 'Wong',
    role: UserRole.RESIDENT,
  },
  {
    email: 'michael.brown@outlook.com',
    password: 'Resident1234',
    firstName: 'Michael',
    lastName: 'Brown',
    role: UserRole.RESIDENT,
  },
  {
    email: 'yuki.tanaka@gmail.com',
    password: 'Resident1234',
    firstName: 'Yuki',
    lastName: 'Tanaka',
    role: UserRole.RESIDENT,
  },
  {
    email: 'arisa.charoensuk@gmail.com',
    password: 'Resident1234',
    firstName: 'อริสา',
    lastName: 'เจริญสุข',
    role: UserRole.RESIDENT,
  },
  {
    email: 'thanapat.munkong@gmail.com',
    password: 'Resident1234',
    firstName: 'ธนภัทร',
    lastName: 'มั่นคง',
    role: UserRole.RESIDENT,
  },
  // Residents (batch 2)
  {
    email: 'supanee.lamthan@gmail.com',
    password: 'Resident1234',
    firstName: 'สุพาณี',
    lastName: 'ลำธาร',
    role: UserRole.RESIDENT,
  },
  {
    email: 'boonsong.wichakarn@gmail.com',
    password: 'Resident1234',
    firstName: 'บุญสง่า',
    lastName: 'วิชาการ',
    role: UserRole.RESIDENT,
  },
  {
    email: 'patcharee.suthisan@gmail.com',
    password: 'Resident1234',
    firstName: 'พัชรี',
    lastName: 'สุทธิสาร',
    role: UserRole.RESIDENT,
  },
  {
    email: 'tawan.pimpa@gmail.com',
    password: 'Resident1234',
    firstName: 'ตะวัน',
    lastName: 'พิมพา',
    role: UserRole.RESIDENT,
  },
  {
    email: 'emma.white@outlook.com',
    password: 'Resident1234',
    firstName: 'Emma',
    lastName: 'White',
    role: UserRole.RESIDENT,
  },
  {
    email: 'suchada.medee@gmail.com',
    password: 'Resident1234',
    firstName: 'สุชาดา',
    lastName: 'มีดี',
    role: UserRole.RESIDENT,
  },
] as const;

async function main() {
  // ── Users ─────────────────────────────────────────────────────────────────
  console.log('Seeding users...');
  const userIds: Record<string, string> = {};

  for (const seed of SEED_USERS) {
    const hashed = await bcrypt.hash(seed.password, 10);
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: { firstName: seed.firstName, lastName: seed.lastName },
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
    update: { totalFloors: 10 },
    create: {
      id: 'seed-building-1',
      name: 'Mova Condo',
      address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
      totalFloors: 10,
      description:
        'คอนโดมิเนียมใจกลางเมือง ใกล้รถไฟฟ้า BTS อโศก สิ่งอำนวยความสะดวกครบครัน',
    },
  });
  console.log(`  ✓ ${building.name} (${building.totalFloors} floors)`);

  // ── Floors ────────────────────────────────────────────────────────────────
  console.log('Seeding floors...');
  const floorIds: string[] = [];

  for (let f = 1; f <= 10; f++) {
    const floor = await prisma.floor.upsert({
      where: {
        buildingId_floorNumber: { buildingId: building.id, floorNumber: f },
      },
      update: {},
      create: { buildingId: building.id, floorNumber: f },
    });
    floorIds.push(floor.id);
    console.log(`  ✓ Floor ${f}`);
  }

  // ── Units (12 per floor) ──────────────────────────────────────────────────
  console.log('Seeding units...');

  const unitDefs = [
    { suffix: '01', area: 22, bedrooms: 0, bathrooms: 1, rent: 7500 },
    { suffix: '02', area: 28, bedrooms: 1, bathrooms: 1, rent: 9000 },
    { suffix: '03', area: 35, bedrooms: 1, bathrooms: 1, rent: 12000 },
    { suffix: '04', area: 45, bedrooms: 1, bathrooms: 2, rent: 15000 },
    { suffix: '05', area: 55, bedrooms: 2, bathrooms: 2, rent: 20000 },
    { suffix: '06', area: 68, bedrooms: 2, bathrooms: 2, rent: 25000 },
    { suffix: '07', area: 25, bedrooms: 1, bathrooms: 1, rent: 8500 },
    { suffix: '08', area: 30, bedrooms: 1, bathrooms: 1, rent: 10000 },
    { suffix: '09', area: 38, bedrooms: 1, bathrooms: 1, rent: 13000 },
    { suffix: '10', area: 48, bedrooms: 2, bathrooms: 1, rent: 16000 },
    { suffix: '11', area: 58, bedrooms: 2, bathrooms: 2, rent: 22000 },
    { suffix: '12', area: 75, bedrooms: 3, bathrooms: 2, rent: 28000 },
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
    console.log(`  ✓ Floor ${fi + 1}: ${fi + 1}01–${fi + 1}12`);
  }

  // ── Residents ─────────────────────────────────────────────────────────────
  console.log('Seeding residents...');

  // [email, floorIndex, unitDefIndex, type, moveInDate, note]
  const residentDefs: [
    string,
    number,
    number,
    ResidentType,
    Date,
    string | null,
  ][] = [
    [
      'john.doe@gmail.com',
      0,
      2,
      ResidentType.OWNER,
      new Date('2023-06-01'),
      'เจ้าของห้อง ชั้น 1',
    ],
    [
      'sarah.smith@hotmail.com',
      1,
      1,
      ResidentType.TENANT,
      new Date('2024-01-10'),
      null,
    ],
    [
      'wichai.srisomboon@gmail.com',
      2,
      4,
      ResidentType.OWNER,
      new Date('2023-09-15'),
      '2 ห้องนอน วิวดี',
    ],
    [
      'malee.jangam@gmail.com',
      3,
      0,
      ResidentType.TENANT,
      new Date('2024-03-01'),
      null,
    ],
    [
      'somchai.jaidee@gmail.com',
      4,
      5,
      ResidentType.OWNER,
      new Date('2022-11-20'),
      'ห้องใหญ่ 2BR+',
    ],
    [
      'david.lee@outlook.com',
      5,
      2,
      ResidentType.TENANT,
      new Date('2024-07-15'),
      'ชาวต่างชาติ สัญญา 1 ปี',
    ],
    [
      'nattaya.prom@gmail.com',
      6,
      3,
      ResidentType.OWNER,
      new Date('2023-01-05'),
      null,
    ],
    [
      'anan.sooksan@gmail.com',
      7,
      1,
      ResidentType.OWNER,
      new Date('2023-08-20'),
      'ซื้อพร้อมเฟอร์นิเจอร์',
    ],
    [
      'pranee.wongsiri@gmail.com',
      1,
      4,
      ResidentType.TENANT,
      new Date('2024-02-15'),
      null,
    ],
    [
      'krit.limpichai@gmail.com',
      8,
      5,
      ResidentType.OWNER,
      new Date('2022-05-10'),
      'ห้องมุม วิวสระ',
    ],
    [
      'pim.thanakul@gmail.com',
      0,
      5,
      ResidentType.TENANT,
      new Date('2024-11-01'),
      null,
    ],
    [
      'chaiyot.boonmak@gmail.com',
      3,
      3,
      ResidentType.OWNER,
      new Date('2023-04-15'),
      null,
    ],
    [
      'lisa.wong@gmail.com',
      9,
      4,
      ResidentType.TENANT,
      new Date('2024-06-01'),
      'ชาวต่างชาติ สัญญา 2 ปี',
    ],
    [
      'michael.brown@outlook.com',
      9,
      2,
      ResidentType.OWNER,
      new Date('2023-11-20'),
      null,
    ],
    [
      'yuki.tanaka@gmail.com',
      5,
      0,
      ResidentType.TENANT,
      new Date('2025-01-10'),
      null,
    ],
    [
      'arisa.charoensuk@gmail.com',
      7,
      3,
      ResidentType.TENANT,
      new Date('2024-09-05'),
      null,
    ],
    [
      'thanapat.munkong@gmail.com',
      2,
      2,
      ResidentType.OWNER,
      new Date('2023-07-10'),
      null,
    ],
    // john.doe มีห้องที่ 2
    [
      'john.doe@gmail.com',
      4,
      2,
      ResidentType.OWNER,
      new Date('2024-01-15'),
      'ห้องที่ 2 ให้เช่า',
    ],
    // batch 2 residents — units 07-12
    [
      'supanee.lamthan@gmail.com',
      2,
      6,
      ResidentType.TENANT,
      new Date('2024-05-01'),
      null,
    ],
    [
      'boonsong.wichakarn@gmail.com',
      4,
      7,
      ResidentType.OWNER,
      new Date('2023-03-15'),
      '2 ห้องนอน ชั้น 5',
    ],
    [
      'patcharee.suthisan@gmail.com',
      5,
      8,
      ResidentType.TENANT,
      new Date('2024-08-20'),
      null,
    ],
    [
      'tawan.pimpa@gmail.com',
      6,
      9,
      ResidentType.OWNER,
      new Date('2023-12-01'),
      null,
    ],
    [
      'emma.white@outlook.com',
      7,
      10,
      ResidentType.TENANT,
      new Date('2025-02-01'),
      'ชาวต่างชาติ สัญญา 1 ปี',
    ],
    [
      'suchada.medee@gmail.com',
      8,
      11,
      ResidentType.OWNER,
      new Date('2022-09-10'),
      'ห้องมุม 3 ห้องนอน',
    ],
  ];

  const residentIds: Record<string, string> = {}; // key: `${email}-${fi}-${ui}`

  for (const [email, fi, ui, type, moveIn, note] of residentDefs) {
    const userId = userIds[email];
    const unitId = unitIds[fi][ui];
    if (!userId || !unitId) continue;

    let resident = await prisma.resident.findFirst({
      where: { userId, unitId },
    });
    if (resident) {
      if (!resident.createdById) {
        await prisma.resident.update({
          where: { id: resident.id },
          data: { createdById: userIds['admin@movacondo.co.th'] },
        });
      }
      console.log(`  – skip  ${email} → unit already seeded`);
    } else {
      resident = await prisma.resident.create({
        data: {
          userId,
          unitId,
          residentType: type,
          moveInDate: moveIn,
          note,
          createdById: userIds['admin@movacondo.co.th'],
        },
      });
      await prisma.unit.update({
        where: { id: unitId },
        data: { occupancyStatus: OccupancyStatus.OCCUPIED },
      });
      console.log(`  ✓ ${type.padEnd(6)} ${email}`);
    }
    residentIds[`${email}-${fi}-${ui}`] = resident.id;
  }

  // ── Family Members & Emergency Contacts ───────────────────────────────────
  console.log('Seeding family members & emergency contacts...');

  type FamilySeed = {
    firstName: string;
    lastName: string;
    relationship: string;
    phone?: string;
  };
  type EmergencySeed = {
    firstName: string;
    lastName: string;
    relationship: string;
    phone: string;
  };

  const contactDefs: {
    key: string;
    family?: FamilySeed[];
    emergency?: EmergencySeed[];
  }[] = [
    {
      key: 'john.doe@gmail.com-0-2',
      family: [
        {
          firstName: 'Jane',
          lastName: 'Doe',
          relationship: 'Spouse',
          phone: '0891234567',
        },
        { firstName: 'Tommy', lastName: 'Doe', relationship: 'Child' },
      ],
      emergency: [
        {
          firstName: 'Mary',
          lastName: 'Doe',
          relationship: 'Mother',
          phone: '0812223334',
        },
      ],
    },
    {
      key: 'wichai.srisomboon@gmail.com-2-4',
      family: [
        {
          firstName: 'วรรณา',
          lastName: 'ศรีสมบูรณ์',
          relationship: 'Spouse',
          phone: '0867654321',
        },
        { firstName: 'กิตติ', lastName: 'ศรีสมบูรณ์', relationship: 'Child' },
      ],
      emergency: [
        {
          firstName: 'ประยุทธ',
          lastName: 'ศรีสมบูรณ์',
          relationship: 'Father',
          phone: '0834561234',
        },
      ],
    },
    {
      key: 'somchai.jaidee@gmail.com-4-5',
      family: [
        {
          firstName: 'สุดา',
          lastName: 'ใจดี',
          relationship: 'Spouse',
          phone: '0856781234',
        },
      ],
      emergency: [
        {
          firstName: 'วิชาญ',
          lastName: 'ใจดี',
          relationship: 'Brother',
          phone: '0823456789',
        },
      ],
    },
    {
      key: 'nattaya.prom@gmail.com-6-3',
      emergency: [
        {
          firstName: 'สมพร',
          lastName: 'พรหมสุวรรณ',
          relationship: 'Father',
          phone: '0845671234',
        },
      ],
    },
    {
      key: 'anan.sooksan@gmail.com-7-1',
      family: [
        {
          firstName: 'รัตนา',
          lastName: 'สุขสันต์',
          relationship: 'Spouse',
          phone: '0878901234',
        },
      ],
      emergency: [
        {
          firstName: 'พิชัย',
          lastName: 'สุขสันต์',
          relationship: 'Father',
          phone: '0834509876',
        },
      ],
    },
    {
      key: 'krit.limpichai@gmail.com-8-5',
      family: [
        {
          firstName: 'ปาณิสรา',
          lastName: 'ลิมปิชัย',
          relationship: 'Spouse',
          phone: '0890123456',
        },
      ],
      emergency: [
        {
          firstName: 'ลัดดา',
          lastName: 'ลิมปิชัย',
          relationship: 'Mother',
          phone: '0812348765',
        },
      ],
    },
    {
      key: 'chaiyot.boonmak@gmail.com-3-3',
      family: [
        {
          firstName: 'นันทิดา',
          lastName: 'บุญมาก',
          relationship: 'Spouse',
          phone: '0867890123',
        },
        { firstName: 'ปิยะ', lastName: 'บุญมาก', relationship: 'Child' },
      ],
      emergency: [
        {
          firstName: 'สมศรี',
          lastName: 'บุญมาก',
          relationship: 'Mother',
          phone: '0856789012',
        },
      ],
    },
    {
      key: 'michael.brown@outlook.com-9-2',
      family: [
        {
          firstName: 'Jennifer',
          lastName: 'Brown',
          relationship: 'Spouse',
          phone: '0823456780',
        },
      ],
      emergency: [
        {
          firstName: 'Robert',
          lastName: 'Brown',
          relationship: 'Father',
          phone: '+1-555-0123',
        },
      ],
    },
    {
      key: 'lisa.wong@gmail.com-9-4',
      emergency: [
        {
          firstName: 'Christine',
          lastName: 'Wong',
          relationship: 'Mother',
          phone: '+852-9876-5432',
        },
      ],
    },
  ];

  for (const def of contactDefs) {
    const residentId = residentIds[def.key];
    if (!residentId) continue;

    if (def.family && def.family.length > 0) {
      const existing = await prisma.familyMember.count({
        where: { residentId },
      });
      if (existing === 0) {
        for (const f of def.family) {
          await prisma.familyMember.create({ data: { residentId, ...f } });
        }
        console.log(
          `  ✓ family(${def.family.length})     → ${def.key.split('@')[0]}`,
        );
      } else {
        console.log(`  – skip family         → ${def.key.split('@')[0]}`);
      }
    }

    if (def.emergency && def.emergency.length > 0) {
      const existing = await prisma.emergencyContact.count({
        where: { residentId },
      });
      if (existing === 0) {
        for (const e of def.emergency) {
          await prisma.emergencyContact.create({ data: { residentId, ...e } });
        }
        console.log(
          `  ✓ emergency(${def.emergency.length})  → ${def.key.split('@')[0]}`,
        );
      } else {
        console.log(`  – skip emergency      → ${def.key.split('@')[0]}`);
      }
    }
  }

  // ── Announcements ─────────────────────────────────────────────────────────
  console.log('Seeding announcements...');

  const adminId = userIds['admin@movacondo.co.th'];
  const managerId = userIds['manager@movacondo.co.th'];

  const announcementDefs = [
    {
      id: 'seed-ann-1',
      title: 'ยินดีต้อนรับสู่ Mova Condo',
      content:
        'ขอต้อนรับผู้พักอาศัยทุกท่านสู่ Mova Condo ระบบการจัดการคอนโดมิเนียมของเราพร้อมให้บริการแล้ว สามารถติดต่อสอบถามได้ที่สำนักงานนิติบุคคลชั้น 1 วันจันทร์–ศุกร์ 08:00–18:00 น.',
      isPinned: true,
      status: AnnouncementStatus.ACTIVE,
      expiredAt: null,
      createdById: adminId,
    },
    {
      id: 'seed-ann-2',
      title: 'แจ้งปิดปรับปรุงสระว่ายน้ำ',
      content:
        'สระว่ายน้ำจะปิดปรับปรุงชั่วคราวในวันที่ 20–25 เมษายน 2568 เพื่อทำความสะอาดและเปลี่ยนระบบกรองน้ำ ขออภัยในความไม่สะดวก',
      isPinned: false,
      status: AnnouncementStatus.ACTIVE,
      expiredAt: new Date('2025-04-25'),
      createdById: managerId,
    },
    {
      id: 'seed-ann-3',
      title: 'กำหนดชำระค่าส่วนกลางประจำเดือนเมษายน',
      content:
        'ขอแจ้งเตือนผู้พักอาศัยทุกท่านให้ชำระค่าส่วนกลางประจำเดือนเมษายนภายในวันที่ 10 เมษายน 2568 เพื่อหลีกเลี่ยงค่าปรับ สามารถชำระได้ที่สำนักงานหรือโอนผ่านธนาคาร',
      isPinned: true,
      status: AnnouncementStatus.ACTIVE,
      expiredAt: new Date('2025-04-10'),
      createdById: managerId,
    },
    {
      id: 'seed-ann-4',
      title: 'ประกาศงดใช้ลิฟต์ฝั่ง A (หมดอายุแล้ว)',
      content:
        'ลิฟต์ฝั่ง A อาคาร 1 จะงดให้บริการชั่วคราวเพื่อบำรุงรักษาประจำปี โปรดใช้ลิฟต์ฝั่ง B แทน',
      isPinned: false,
      status: AnnouncementStatus.ACTIVE,
      expiredAt: new Date('2025-03-01'),
      createdById: managerId,
    },
    {
      id: 'seed-ann-5',
      title: 'ระเบียบการจอดรถยนต์',
      content:
        'ขอความร่วมมือผู้พักอาศัยจอดรถในพื้นที่ที่กำหนดเท่านั้น ห้ามจอดบริเวณทางเดินและหน้าประตูฉุกเฉิน ฝ่าฝืนจะถูกปรับตามระเบียบของนิติบุคคล',
      isPinned: false,
      status: AnnouncementStatus.ACTIVE,
      expiredAt: null,
      createdById: adminId,
    },
    {
      id: 'seed-ann-6',
      title: 'ประกาศปิดระบบน้ำชั่วคราว (ยกเลิกแล้ว)',
      content: 'ยกเลิกการปิดระบบน้ำเนื่องจากช่างซ่อมแซมเสร็จสิ้นก่อนกำหนด',
      isPinned: false,
      status: AnnouncementStatus.EXPIRED,
      expiredAt: null,
      createdById: managerId,
    },
    {
      id: 'seed-ann-7',
      title: 'กฎการใช้ห้องออกกำลังกาย',
      content:
        'ห้องฟิตเนสเปิดให้บริการ 06:00–22:00 น. ทุกวัน กรุณาเช็คอิน-เช็คเอาต์ทุกครั้ง ห้ามนำอาหารและเครื่องดื่มเข้า ผู้ใช้บริการต้องสวมรองเท้าออกกำลังกายทุกครั้ง',
      isPinned: false,
      status: AnnouncementStatus.ACTIVE,
      expiredAt: null,
      createdById: adminId,
    },
    {
      id: 'seed-ann-8',
      title: 'จุดรับพัสดุและจดหมาย',
      content:
        'นิติบุคคลได้จัดตั้งจุดรับพัสดุบริเวณล็อบบี้ชั้น 1 ผู้พักอาศัยสามารถรับพัสดุได้ 24 ชั่วโมง โดยใช้รหัส OTP ที่ส่งให้ทาง SMS หากมีข้อสงสัยติดต่อเคาน์เตอร์นิติบุคคล',
      isPinned: true,
      status: AnnouncementStatus.ACTIVE,
      expiredAt: null,
      createdById: managerId,
    },
    {
      id: 'seed-ann-9',
      title: 'ขอความร่วมมือลดเสียงรบกวน',
      content:
        'ขอความร่วมมือผู้พักอาศัยงดทำเสียงดังหลัง 22:00 น. โดยเฉพาะบริเวณระเบียงและห้องนั่งเล่น เพื่อไม่รบกวนผู้พักอาศัยท่านอื่น',
      isPinned: false,
      status: AnnouncementStatus.ACTIVE,
      expiredAt: null,
      createdById: managerId,
    },
    {
      id: 'seed-ann-10',
      title: 'กำหนดการตรวจสอบอาคารประจำปี 2568',
      content:
        'แจ้งให้ทราบว่าจะมีการตรวจสอบระบบความปลอดภัยของอาคารประจำปี 2568 ในวันที่ 1–3 พฤษภาคม 2568 เจ้าหน้าที่จะเข้าตรวจสอบห้องพักและพื้นที่ส่วนกลาง กรุณาอำนวยความสะดวก',
      isPinned: false,
      status: AnnouncementStatus.ACTIVE,
      expiredAt: new Date('2025-05-03'),
      createdById: adminId,
    },
    {
      id: 'seed-ann-11',
      title: 'อัปเกรดระบบอินเทอร์เน็ตส่วนกลาง',
      content:
        'นิติบุคคลได้อัปเกรดระบบอินเทอร์เน็ต Wi-Fi ส่วนกลางเป็น Fiber 1 Gbps แล้ว ตั้งแต่วันที่ 1 เมษายน 2568 เชื่อมต่อด้วย SSID: MovaCondo-Free รหัสผ่าน: mova2025',
      isPinned: false,
      status: AnnouncementStatus.ACTIVE,
      expiredAt: null,
      createdById: adminId,
    },
    {
      id: 'seed-ann-12',
      title: 'งานเลี้ยงปีใหม่ Mova Condo 2568 (หมดอายุแล้ว)',
      content:
        'ขอเชิญผู้พักอาศัยทุกท่านร่วมงานเลี้ยงปีใหม่ Mova Condo 2568 วันที่ 31 ธันวาคม 2567 เวลา 19:00–22:00 น. ณ ลานกิจกรรมชั้น 1 มีอาหาร เครื่องดื่ม และของรางวัลมากมาย',
      isPinned: false,
      status: AnnouncementStatus.EXPIRED,
      expiredAt: new Date('2024-12-31'),
      createdById: adminId,
    },
  ];

  for (const ann of announcementDefs) {
    await prisma.announcement.upsert({
      where: { id: ann.id },
      update: {},
      create: ann,
    });
    console.log(`  ✓ ${ann.isPinned ? '[PIN] ' : '      '}${ann.title}`);
  }

  // ── Visitors ──────────────────────────────────────────────────────────────
  console.log('Seeding visitors...');

  const guardId = userIds['guard@movacondo.co.th'];

  const visitorDefs: VisitorSeed[] = [
    // Currently inside
    {
      id: 'seed-vis-1',
      name: 'สมศักดิ์ มีสุข',
      phone: '0812345678',
      purpose: 'เยี่ยมญาติ',
      vehiclePlate: 'กค-4521',
      groupSize: 3,
      unitKey: [0, 2],
      residentEmail: 'john.doe@gmail.com',
      checkInAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'seed-vis-2',
      name: 'Flash Express',
      purpose: 'ส่งพัสดุ',
      vehiclePlate: 'กข-1234',
      unitKey: [2, 4],
      checkInAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: 'seed-vis-6',
      name: 'ปิยะ ทองดี',
      phone: '0867891234',
      purpose: 'เยี่ยมเพื่อน',
      vehiclePlate: 'ชธ-8833',
      groupSize: 2,
      unitKey: [1, 4],
      residentEmail: 'pranee.wongsiri@gmail.com',
      checkInAt: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      id: 'seed-vis-7',
      name: 'คุณแม่ของอริสา',
      phone: '0899001122',
      purpose: 'เยี่ยมลูก',
      vehiclePlate: 'งง-2277',
      groupSize: 4,
      unitKey: [7, 3],
      residentEmail: 'arisa.charoensuk@gmail.com',
      checkInAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: 'seed-vis-11',
      name: 'Kevin Park',
      phone: '0823456789',
      purpose: 'Visit colleague',
      unitKey: [9, 4],
      residentEmail: 'lisa.wong@gmail.com',
      checkInAt: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      id: 'seed-vis-13',
      name: 'ช่างไฟฟ้า PowerFix',
      purpose: 'ซ่อมระบบไฟ',
      vehiclePlate: 'งจ-9900',
      groupSize: 2,
      unitKey: [2, 2],
      residentEmail: 'thanapat.munkong@gmail.com',
      checkInAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
    },
    // Checked out
    {
      id: 'seed-vis-3',
      name: 'นภา รักดี',
      phone: '0898765432',
      purpose: 'ประชุมธุรกิจ',
      vehiclePlate: 'มก-5566',
      unitKey: [4, 5],
      residentEmail: 'somchai.jaidee@gmail.com',
      checkInAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      checkedOutByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-vis-4',
      name: 'James Wilson',
      phone: '0856781234',
      purpose: 'Visit friend',
      unitKey: [5, 2],
      residentEmail: 'david.lee@outlook.com',
      checkInAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
      checkedOutByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-vis-5',
      name: 'ช่างแอร์ Cool Service',
      purpose: 'ซ่อมบำรุงแอร์',
      vehiclePlate: 'งจ-5678',
      groupSize: 3,
      unitKey: [6, 3],
      residentEmail: 'nattaya.prom@gmail.com',
      checkInAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isAutoExpired: true,
    },
    {
      id: 'seed-vis-8',
      name: 'DHL Express',
      purpose: 'ส่งพัสดุด่วนต่างประเทศ',
      vehiclePlate: 'ขค-7755',
      unitKey: [9, 2],
      residentEmail: 'michael.brown@outlook.com',
      checkInAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
      checkedOutByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-vis-9',
      name: 'Yoko Yamada',
      phone: '0845678901',
      purpose: 'Visit friend',
      vehiclePlate: 'ฮบ-3301',
      unitKey: [5, 0],
      residentEmail: 'yuki.tanaka@gmail.com',
      checkInAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      checkedOutByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-vis-10',
      name: 'ช่างซ่อมประปา',
      purpose: 'ซ่อมท่อน้ำรั่ว',
      vehiclePlate: 'บต-1190',
      groupSize: 2,
      unitKey: [3, 0],
      residentEmail: 'malee.jangam@gmail.com',
      checkInAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 8.5 * 60 * 60 * 1000),
      checkedOutByEmail: 'manager@movacondo.co.th',
    },
    {
      id: 'seed-vis-12',
      name: 'ลุงแสง',
      phone: '0834561234',
      purpose: 'เยี่ยมหลาน',
      vehiclePlate: 'นข-6644',
      unitKey: [7, 1],
      residentEmail: 'anan.sooksan@gmail.com',
      checkInAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 27 * 60 * 60 * 1000),
      checkedOutByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-vis-14',
      name: 'บริษัททำความสะอาด CleanPro',
      purpose: 'ทำความสะอาดพิเศษ',
      vehiclePlate: 'พร-4422',
      groupSize: 5,
      unitKey: [8, 5],
      residentEmail: 'krit.limpichai@gmail.com',
      checkInAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      isAutoExpired: true,
    },
    {
      id: 'seed-vis-15',
      name: 'นายณัฐ ชมภู',
      phone: '0878901234',
      purpose: 'ดูห้อง (ผู้เช่าใหม่)',
      unitKey: [0, 5],
      residentEmail: 'pim.thanakul@gmail.com',
      checkInAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
      checkedOutByEmail: 'guard@movacondo.co.th',
    },
    // Visitors for new residents (units 07-12) — some with phone+vehiclePlate
    {
      id: 'seed-vis-16',
      name: 'รุ่งนภา สุขใส',
      phone: '0841122334',
      purpose: 'เยี่ยมเพื่อน',
      vehiclePlate: 'กง-5512',
      unitKey: [2, 6],
      residentEmail: 'supanee.lamthan@gmail.com',
      checkInAt: new Date(Date.now() - 80 * 60 * 1000),
    },
    {
      id: 'seed-vis-17',
      name: 'ช่างซ่อมแอร์ AirFix',
      phone: '0855667788',
      purpose: 'ซ่อมบำรุงแอร์',
      vehiclePlate: 'พน-3301',
      groupSize: 2,
      unitKey: [4, 7],
      residentEmail: 'boonsong.wichakarn@gmail.com',
      checkInAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      checkedOutByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-vis-18',
      name: 'Tom Baker',
      phone: '0892233445',
      purpose: 'Visit friend',
      vehiclePlate: 'ฮก-7790',
      unitKey: [7, 10],
      residentEmail: 'emma.white@outlook.com',
      checkInAt: new Date(Date.now() - 55 * 60 * 1000),
    },
    {
      id: 'seed-vis-19',
      name: 'ไพรัตน์ วงษ์ดี',
      phone: '0876543210',
      purpose: 'ส่งของขวัญ',
      vehiclePlate: 'งน-4488',
      unitKey: [6, 9],
      residentEmail: 'tawan.pimpa@gmail.com',
      checkInAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 17 * 60 * 60 * 1000),
      checkedOutByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-vis-20',
      name: 'บริษัทขนย้าย QuickMove',
      phone: '0811223344',
      purpose: 'ขนย้ายสิ่งของ',
      vehiclePlate: 'บจ-1188',
      groupSize: 4,
      unitKey: [8, 11],
      residentEmail: 'suchada.medee@gmail.com',
      checkInAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      checkOutAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      checkedOutByEmail: 'manager@movacondo.co.th',
    },
  ];

  for (const v of visitorDefs) {
    const unitId = unitIds[v.unitKey[0]][v.unitKey[1]];
    let residentId: string | undefined;
    if (v.residentEmail) {
      const resUserId = userIds[v.residentEmail];
      const resident = await prisma.resident.findFirst({
        where: { userId: resUserId, unitId },
      });
      residentId = resident?.id;
    }
    const checkedOutById = v.checkedOutByEmail
      ? userIds[v.checkedOutByEmail]
      : undefined;

    await prisma.visitor.upsert({
      where: { id: v.id },
      update: { checkedOutById, isAutoExpired: v.isAutoExpired ?? false },
      create: {
        id: v.id,
        name: v.name,
        phone: v.phone,
        purpose: v.purpose,
        vehiclePlate: v.vehiclePlate,
        groupSize: v.groupSize ?? 1,
        unitId,
        residentId,
        recordedById: guardId,
        checkInAt: v.checkInAt,
        checkOutAt: v.checkOutAt,
        checkedOutById,
        isAutoExpired: v.isAutoExpired ?? false,
      },
    });
    const status = v.checkOutAt ? 'OUT' : 'IN ';
    console.log(`  ✓ [${status}] ${v.name}`);
  }

  // ── Parcels ───────────────────────────────────────────────────────────────
  console.log('Seeding parcels...');

  type ParcelSeed = {
    id: string;
    trackingNumber?: string;
    carrier?: string;
    note?: string;
    status: 'PENDING' | 'CLAIMED';
    unitKey: [number, number];
    residentEmail?: string;
    receivedAt: Date;
    claimedAt?: Date;
    receivedByEmail: string;
    claimedByEmail?: string;
  };

  const parcelDefs: ParcelSeed[] = [
    // Pending (waiting for pickup)
    {
      id: 'seed-par-1',
      trackingNumber: 'TH123456789',
      carrier: 'Flash Express',
      unitKey: [0, 2],
      residentEmail: 'john.doe@gmail.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-2',
      trackingNumber: 'KE987654321',
      carrier: 'Kerry Express',
      unitKey: [2, 4],
      residentEmail: 'wichai.srisomboon@gmail.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-3',
      carrier: 'DHL',
      note: 'กล่องใหญ่ เก็บไว้ที่เคาน์เตอร์',
      unitKey: [9, 2],
      residentEmail: 'michael.brown@outlook.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-4',
      trackingNumber: 'JT556677889',
      carrier: 'J&T Express',
      unitKey: [1, 1],
      residentEmail: 'sarah.smith@hotmail.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-5',
      trackingNumber: 'SP334455667',
      carrier: 'Speed-D',
      unitKey: [6, 3],
      residentEmail: 'nattaya.prom@gmail.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      note: 'รอมา 1 วันแล้ว',
      receivedByEmail: 'guard@movacondo.co.th',
    },
    // Claimed
    {
      id: 'seed-par-6',
      trackingNumber: 'FL112233445',
      carrier: 'Flash Express',
      unitKey: [4, 5],
      residentEmail: 'somchai.jaidee@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-7',
      trackingNumber: 'TH998877665',
      carrier: 'Thailand Post',
      unitKey: [7, 1],
      residentEmail: 'anan.sooksan@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-8',
      trackingNumber: 'LZ223344556',
      carrier: 'Lazada Logistics',
      unitKey: [9, 4],
      residentEmail: 'lisa.wong@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 46 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'manager@movacondo.co.th',
    },
    // Pending — page 2+
    {
      id: 'seed-par-9',
      trackingNumber: 'SX445566778',
      carrier: 'Shopee Xpress',
      unitKey: [3, 0],
      residentEmail: 'malee.jangam@gmail.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-10',
      carrier: 'Thailand Post',
      note: 'พัสดุลงทะเบียน',
      unitKey: [7, 10],
      residentEmail: 'emma.white@outlook.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-11',
      trackingNumber: 'NV667788990',
      carrier: 'Ninja Van',
      unitKey: [4, 7],
      residentEmail: 'boonsong.wichakarn@gmail.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-12',
      trackingNumber: 'FL778899001',
      carrier: 'Flash Express',
      unitKey: [8, 11],
      residentEmail: 'suchada.medee@gmail.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-13',
      trackingNumber: 'KE889900112',
      carrier: 'Kerry Express',
      unitKey: [6, 9],
      residentEmail: 'tawan.pimpa@gmail.com',
      status: 'PENDING',
      note: 'รอมา 2 วันแล้ว',
      receivedAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-21',
      trackingNumber: 'LZ556677883',
      carrier: 'Lazada Logistics',
      unitKey: [1, 4],
      residentEmail: 'pranee.wongsiri@gmail.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-22',
      trackingNumber: 'TH334455671',
      carrier: 'Thailand Post',
      unitKey: [5, 8],
      residentEmail: 'patcharee.suthisan@gmail.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-23',
      trackingNumber: 'SP990011225',
      carrier: 'Speed-D',
      unitKey: [3, 3],
      residentEmail: 'chaiyot.boonmak@gmail.com',
      status: 'PENDING',
      receivedAt: new Date(Date.now() - 38 * 60 * 60 * 1000),
      note: 'ฝากเก็บไว้ที่เคาน์เตอร์',
      receivedByEmail: 'guard@movacondo.co.th',
    },
    // Claimed — page 2+
    {
      id: 'seed-par-14',
      trackingNumber: 'SX112233440',
      carrier: 'Shopee Xpress',
      unitKey: [0, 2],
      residentEmail: 'john.doe@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 70 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-15',
      trackingNumber: 'LZ334455669',
      carrier: 'Lazada Logistics',
      unitKey: [2, 4],
      residentEmail: 'wichai.srisomboon@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 34 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-16',
      trackingNumber: 'DH556677882',
      carrier: 'DHL',
      unitKey: [5, 2],
      residentEmail: 'david.lee@outlook.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 90 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'manager@movacondo.co.th',
    },
    {
      id: 'seed-par-17',
      trackingNumber: 'FL990011223',
      carrier: 'Flash Express',
      unitKey: [7, 3],
      residentEmail: 'arisa.charoensuk@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-18',
      trackingNumber: 'JT223344557',
      carrier: 'J&T Express',
      unitKey: [2, 6],
      residentEmail: 'supanee.lamthan@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 54 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 52 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-19',
      trackingNumber: 'TH001122334',
      carrier: 'Thailand Post',
      unitKey: [8, 5],
      residentEmail: 'krit.limpichai@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 118 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'manager@movacondo.co.th',
    },
    {
      id: 'seed-par-20',
      trackingNumber: 'SP112233446',
      carrier: 'Speed-D',
      unitKey: [0, 5],
      residentEmail: 'pim.thanakul@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-24',
      trackingNumber: 'KE778899004',
      carrier: 'Kerry Express',
      unitKey: [9, 2],
      residentEmail: 'michael.brown@outlook.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 144 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 140 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-25',
      trackingNumber: 'NV445566779',
      carrier: 'Ninja Van',
      unitKey: [5, 0],
      residentEmail: 'yuki.tanaka@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 60 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 58 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-26',
      trackingNumber: 'SX667788995',
      carrier: 'Shopee Xpress',
      unitKey: [4, 5],
      residentEmail: 'somchai.jaidee@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 80 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 78 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
    {
      id: 'seed-par-27',
      trackingNumber: 'FL334455668',
      carrier: 'Flash Express',
      unitKey: [6, 3],
      residentEmail: 'nattaya.prom@gmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 168 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 165 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'manager@movacondo.co.th',
    },
    {
      id: 'seed-par-28',
      trackingNumber: 'JT889900113',
      carrier: 'J&T Express',
      unitKey: [1, 1],
      residentEmail: 'sarah.smith@hotmail.com',
      status: 'CLAIMED',
      receivedAt: new Date(Date.now() - 110 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 108 * 60 * 60 * 1000),
      receivedByEmail: 'guard@movacondo.co.th',
      claimedByEmail: 'guard@movacondo.co.th',
    },
  ];

  for (const p of parcelDefs) {
    const unitId = unitIds[p.unitKey[0]][p.unitKey[1]];
    let residentId: string | undefined;
    if (p.residentEmail) {
      const resUserId = userIds[p.residentEmail];
      const resident = await prisma.resident.findFirst({
        where: { userId: resUserId, unitId },
      });
      residentId = resident?.id;
    }
    const receivedById = userIds[p.receivedByEmail];
    const claimedById = p.claimedByEmail
      ? userIds[p.claimedByEmail]
      : undefined;

    await prisma.parcel.upsert({
      where: { id: p.id },
      update: { claimedById, claimedAt: p.claimedAt, status: p.status },
      create: {
        id: p.id,
        trackingNumber: p.trackingNumber,
        carrier: p.carrier,
        note: p.note,
        status: p.status,
        unitId,
        residentId,
        receivedAt: p.receivedAt,
        claimedAt: p.claimedAt,
        receivedById,
        claimedById,
      },
    });
    const tracking = p.trackingNumber ?? 'no tracking';
    const carrier = p.carrier ?? '—';
    console.log(`  ✓ [${p.status.padEnd(7)}] ${carrier} → ${tracking}`);
  }

  // ── Maintenance tickets ──────────────────────────────────────────────────
  console.log('Seeding maintenance tickets...');

  type TicketSeed = {
    id: string;
    title: string;
    description: string;
    category:
      | 'ELECTRICAL'
      | 'PLUMBING'
      | 'HVAC'
      | 'STRUCTURAL'
      | 'APPLIANCE'
      | 'OTHER';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
    unitKey: [number, number];
    residentEmail?: string;
    reportedByEmail: string;
    assignedToEmail?: string;
    note?: string;
    resolvedAt?: Date;
    createdAt: Date;
    logs?: {
      action: string;
      oldValue?: string | null;
      newValue?: string | null;
      byEmail: string;
      offsetMs: number;
    }[];
  };

  const ticketDefs: TicketSeed[] = [
    {
      id: 'tkt-001',
      title: 'หลอดไฟในห้องน้ำเสีย',
      description: 'หลอดไฟในห้องน้ำดับ 2 ดวง เปลี่ยนหลอดใหม่แล้วยังไม่ติด',
      category: 'ELECTRICAL',
      status: 'OPEN',
      unitKey: [0, 0],
      residentEmail: 'somchai.jaidee@gmail.com',
      reportedByEmail: 'somchai.jaidee@gmail.com',
      createdAt: new Date(Date.now() - 2 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'somchai.jaidee@gmail.com',
          offsetMs: 0,
        },
      ],
    },
    {
      id: 'tkt-002',
      title: 'ก๊อกน้ำในครัวรั่ว',
      description: 'ก๊อกน้ำในครัวหยดตลอดเวลา น้ำไหลไม่หยุด',
      category: 'PLUMBING',
      status: 'IN_PROGRESS',
      unitKey: [0, 1],
      residentEmail: 'malee.jangam@gmail.com',
      reportedByEmail: 'malee.jangam@gmail.com',
      assignedToEmail: 'maintenance@movacondo.co.th',
      note: 'ส่งช่างไปดูแล้ว รอสั่งอะไหล่',
      createdAt: new Date(Date.now() - 26 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'malee.jangam@gmail.com',
          offsetMs: 0,
        },
        {
          action: 'ASSIGNED',
          newValue: 'ประสิทธิ์ สุขใจ',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 1 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'OPEN',
          newValue: 'IN_PROGRESS',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 2 * 3600000,
        },
        {
          action: 'NOTE_UPDATED',
          oldValue: null,
          newValue: 'ส่งช่างไปดูแล้ว รอสั่งอะไหล่',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 3 * 3600000,
        },
      ],
    },
    {
      id: 'tkt-003',
      title: 'แอร์ไม่เย็น',
      description: 'แอร์ในห้องนอนเปิดแล้วลมออก แต่ไม่เย็น น่าจะแก๊สหมด',
      category: 'HVAC',
      status: 'RESOLVED',
      unitKey: [1, 2],
      residentEmail: 'wichai.srisomboon@gmail.com',
      reportedByEmail: 'wichai.srisomboon@gmail.com',
      assignedToEmail: 'maintenance@movacondo.co.th',
      note: 'เติมแก๊สแอร์เรียบร้อย',
      resolvedAt: new Date(Date.now() - 12 * 3600000),
      createdAt: new Date(Date.now() - 3 * 24 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'wichai.srisomboon@gmail.com',
          offsetMs: 0,
        },
        {
          action: 'ASSIGNED',
          newValue: 'ประสิทธิ์ สุขใจ',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 2 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'OPEN',
          newValue: 'IN_PROGRESS',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 4 * 3600000,
        },
        {
          action: 'NOTE_UPDATED',
          oldValue: null,
          newValue: 'เติมแก๊สแอร์เรียบร้อย',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 36 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'IN_PROGRESS',
          newValue: 'RESOLVED',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 3 * 24 * 3600000 - 12 * 3600000,
        },
      ],
    },
    {
      id: 'tkt-004',
      title: 'ประตูห้องปิดไม่สนิท',
      description: 'กลอนประตูหลักมีปัญหา ล็อคไม่ได้ ต้องรีบซ่อม',
      category: 'STRUCTURAL',
      status: 'IN_PROGRESS',
      unitKey: [2, 0],
      residentEmail: 'pranee.wongsiri@gmail.com',
      reportedByEmail: 'guard@movacondo.co.th',
      assignedToEmail: 'maintenance@movacondo.co.th',
      createdAt: new Date(Date.now() - 5 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'guard@movacondo.co.th',
          offsetMs: 0,
        },
        {
          action: 'ASSIGNED',
          newValue: 'ประสิทธิ์ สุขใจ',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 1 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'OPEN',
          newValue: 'IN_PROGRESS',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 2 * 3600000,
        },
      ],
    },
    {
      id: 'tkt-005',
      title: 'เครื่องซักผ้าสั่น ดังมาก',
      description: 'เครื่องซักผ้าสั่นแรงมากตอนปั่นหมาด เสียงดังรบกวนห้องข้างๆ',
      category: 'APPLIANCE',
      status: 'OPEN',
      unitKey: [3, 1],
      residentEmail: 'nattaya.prom@gmail.com',
      reportedByEmail: 'nattaya.prom@gmail.com',
      createdAt: new Date(Date.now() - 1 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'nattaya.prom@gmail.com',
          offsetMs: 0,
        },
      ],
    },
    {
      id: 'tkt-006',
      title: 'ท่อน้ำทิ้งในห้องน้ำตัน',
      description: 'น้ำในอ่างล้างหน้าไหลช้ามาก เหมือนท่อตัน',
      category: 'PLUMBING',
      status: 'RESOLVED',
      unitKey: [0, 3],
      residentEmail: 'krit.limpichai@gmail.com',
      reportedByEmail: 'krit.limpichai@gmail.com',
      assignedToEmail: 'maintenance@movacondo.co.th',
      note: 'ล้างท่อเรียบร้อย',
      resolvedAt: new Date(Date.now() - 24 * 3600000),
      createdAt: new Date(Date.now() - 4 * 24 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'krit.limpichai@gmail.com',
          offsetMs: 0,
        },
        {
          action: 'ASSIGNED',
          newValue: 'ประสิทธิ์ สุขใจ',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 3 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'OPEN',
          newValue: 'IN_PROGRESS',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 6 * 3600000,
        },
        {
          action: 'NOTE_UPDATED',
          oldValue: null,
          newValue: 'ล้างท่อเรียบร้อย',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 2 * 24 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'IN_PROGRESS',
          newValue: 'RESOLVED',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 3 * 24 * 3600000,
        },
      ],
    },
    {
      id: 'tkt-007',
      title: 'ไฟในโถงทางเดินชั้น 5 ดับ',
      description: 'ไฟส่องสว่างในโถงทางเดินชั้น 5 ดับ 3 ดวง มืดมากตอนกลางคืน',
      category: 'ELECTRICAL',
      status: 'CANCELLED',
      unitKey: [4, 0],
      reportedByEmail: 'guard@movacondo.co.th',
      assignedToEmail: 'maintenance@movacondo.co.th',
      note: 'เปลี่ยนหลอดไฟ LED ใหม่ทั้งหมด',
      resolvedAt: new Date(Date.now() - 2 * 24 * 3600000),
      createdAt: new Date(Date.now() - 6 * 24 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'guard@movacondo.co.th',
          offsetMs: 0,
        },
        {
          action: 'ASSIGNED',
          newValue: 'ประสิทธิ์ สุขใจ',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 12 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'OPEN',
          newValue: 'IN_PROGRESS',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 24 * 3600000,
        },
        {
          action: 'NOTE_UPDATED',
          oldValue: null,
          newValue: 'เปลี่ยนหลอดไฟ LED ใหม่ทั้งหมด',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 3 * 24 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'IN_PROGRESS',
          newValue: 'CANCELLED',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 4 * 24 * 3600000,
        },
      ],
    },
    {
      id: 'tkt-008',
      title: 'อุปกรณ์ครัวชำรุด',
      description: 'เตาแก๊สใช้งานไม่ได้ หัวเตาหัวหนึ่งจุดไม่ติด',
      category: 'APPLIANCE',
      status: 'OPEN',
      unitKey: [5, 2],
      residentEmail: 'arisa.charoensuk@gmail.com',
      reportedByEmail: 'arisa.charoensuk@gmail.com',
      createdAt: new Date(Date.now() - 30 * 60000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'arisa.charoensuk@gmail.com',
          offsetMs: 0,
        },
      ],
    },
    {
      id: 'tkt-009',
      title: 'แอร์ส่วนกลางชั้น 3 รั่ว',
      description: 'แอร์ส่วนกลางในล็อบบี้ชั้น 3 มีน้ำหยด พื้นเปียก อาจลื่น',
      category: 'HVAC',
      status: 'IN_PROGRESS',
      unitKey: [2, 1],
      reportedByEmail: 'manager@movacondo.co.th',
      assignedToEmail: 'maintenance@movacondo.co.th',
      note: 'ช่างตรวจสอบแล้ว รอนัดซ่อมใหญ่',
      createdAt: new Date(Date.now() - 2 * 24 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'manager@movacondo.co.th',
          offsetMs: 0,
        },
        {
          action: 'ASSIGNED',
          newValue: 'ประสิทธิ์ สุขใจ',
          byEmail: 'manager@movacondo.co.th',
          offsetMs: 2 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'OPEN',
          newValue: 'IN_PROGRESS',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 6 * 3600000,
        },
        {
          action: 'NOTE_UPDATED',
          oldValue: null,
          newValue: 'ช่างตรวจสอบแล้ว รอนัดซ่อมใหญ่',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 28 * 3600000,
        },
      ],
    },
    {
      id: 'tkt-010',
      title: 'ผนังห้องน้ำแตกร้าว',
      description:
        'ผนังห้องน้ำมีรอยแตกร้าวยาวประมาณ 20 ซม. กังวลเรื่องความชื้น',
      category: 'STRUCTURAL',
      status: 'OPEN',
      unitKey: [6, 0],
      residentEmail: 'thanapat.munkong@gmail.com',
      reportedByEmail: 'thanapat.munkong@gmail.com',
      createdAt: new Date(Date.now() - 3 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'thanapat.munkong@gmail.com',
          offsetMs: 0,
        },
      ],
    },
    {
      id: 'tkt-011',
      title: 'ลิฟต์ขัดข้อง',
      description: 'ลิฟต์หมายเลข 2 เปิดประตูค้าง กดปุ่มชั้นไม่ขึ้น',
      category: 'OTHER',
      status: 'RESOLVED',
      unitKey: [7, 1],
      reportedByEmail: 'guard@movacondo.co.th',
      assignedToEmail: 'maintenance@movacondo.co.th',
      note: 'ติดต่อบริษัทลิฟต์แก้ไขแล้ว',
      resolvedAt: new Date(Date.now() - 6 * 3600000),
      createdAt: new Date(Date.now() - 5 * 24 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'guard@movacondo.co.th',
          offsetMs: 0,
        },
        {
          action: 'ASSIGNED',
          newValue: 'ประสิทธิ์ สุขใจ',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 6 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'OPEN',
          newValue: 'IN_PROGRESS',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 12 * 3600000,
        },
        {
          action: 'REASSIGNED',
          oldValue: 'ประสิทธิ์ สุขใจ',
          newValue: 'ประสิทธิ์ สุขใจ',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 2 * 24 * 3600000,
        },
        {
          action: 'NOTE_UPDATED',
          oldValue: null,
          newValue: 'ติดต่อบริษัทลิฟต์แก้ไขแล้ว',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 4 * 24 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'IN_PROGRESS',
          newValue: 'RESOLVED',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 5 * 24 * 3600000 - 6 * 3600000,
        },
      ],
    },
    {
      id: 'tkt-012',
      title: 'ปลั๊กไฟในห้องนอนไม่มีไฟ',
      description: 'ปลั๊กไฟข้างเตียง 2 ตัวไม่มีไฟ เสียบอะไรก็ไม่ทำงาน',
      category: 'ELECTRICAL',
      status: 'OPEN',
      unitKey: [1, 3],
      residentEmail: 'pim.thanakul@gmail.com',
      reportedByEmail: 'pim.thanakul@gmail.com',
      createdAt: new Date(Date.now() - 4 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'pim.thanakul@gmail.com',
          offsetMs: 0,
        },
      ],
    },
    {
      id: 'tkt-013',
      title: 'ท่อน้ำประปาแตก',
      description: 'ท่อน้ำประปาใต้อ่างล้างจาน แตกน้ำรั่วออกมาเยอะ',
      category: 'PLUMBING',
      status: 'IN_PROGRESS',
      unitKey: [3, 3],
      residentEmail: 'chaiyot.boonmak@gmail.com',
      reportedByEmail: 'chaiyot.boonmak@gmail.com',
      assignedToEmail: 'maintenance@movacondo.co.th',
      note: 'ปิดวาล์วน้ำชั่วคราวแล้ว รอช่างมาเปลี่ยนท่อ',
      createdAt: new Date(Date.now() - 8 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'chaiyot.boonmak@gmail.com',
          offsetMs: 0,
        },
        {
          action: 'ASSIGNED',
          newValue: 'ประสิทธิ์ สุขใจ',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 1 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'OPEN',
          newValue: 'IN_PROGRESS',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 2 * 3600000,
        },
        {
          action: 'NOTE_UPDATED',
          oldValue: null,
          newValue: 'ปิดวาล์วน้ำชั่วคราวแล้ว รอช่างมาเปลี่ยนท่อ',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 3 * 3600000,
        },
      ],
    },
    {
      id: 'tkt-014',
      title: 'เครื่องทำน้ำร้อนเสีย',
      description: 'เครื่องทำน้ำร้อนไม่ทำงาน อาบน้ำไม่ได้น้ำอุ่น',
      category: 'APPLIANCE',
      status: 'CANCELLED',
      unitKey: [4, 2],
      residentEmail: 'supanee.lamthan@gmail.com',
      reportedByEmail: 'supanee.lamthan@gmail.com',
      assignedToEmail: 'maintenance@movacondo.co.th',
      note: 'เปลี่ยนเครื่องทำน้ำร้อนใหม่เรียบร้อย',
      resolvedAt: new Date(Date.now() - 5 * 24 * 3600000),
      createdAt: new Date(Date.now() - 10 * 24 * 3600000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'supanee.lamthan@gmail.com',
          offsetMs: 0,
        },
        {
          action: 'ASSIGNED',
          newValue: 'ประสิทธิ์ สุขใจ',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 6 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'OPEN',
          newValue: 'IN_PROGRESS',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 24 * 3600000,
        },
        {
          action: 'NOTE_UPDATED',
          oldValue: null,
          newValue: 'เปลี่ยนเครื่องทำน้ำร้อนใหม่เรียบร้อย',
          byEmail: 'maintenance@movacondo.co.th',
          offsetMs: 4 * 24 * 3600000,
        },
        {
          action: 'STATUS_CHANGED',
          oldValue: 'IN_PROGRESS',
          newValue: 'CANCELLED',
          byEmail: 'admin@movacondo.co.th',
          offsetMs: 5 * 24 * 3600000,
        },
      ],
    },
    {
      id: 'tkt-015',
      title: 'กลิ่นเหม็นจากท่อระบาย',
      description: 'มีกลิ่นเหม็นจากท่อระบายน้ำในห้องน้ำ โดยเฉพาะตอนเช้า',
      category: 'PLUMBING',
      status: 'OPEN',
      unitKey: [5, 1],
      residentEmail: 'suchada.medee@gmail.com',
      reportedByEmail: 'suchada.medee@gmail.com',
      createdAt: new Date(Date.now() - 50 * 60000),
      logs: [
        {
          action: 'CREATED',
          newValue: 'OPEN',
          byEmail: 'suchada.medee@gmail.com',
          offsetMs: 0,
        },
      ],
    },
  ];

  for (const t of ticketDefs) {
    const [floorIdx, unitIdx] = t.unitKey;
    const unitId = unitIds[floorIdx]?.[unitIdx];
    if (!unitId) {
      console.log(`  – skip ticket ${t.id} → unit not found`);
      continue;
    }

    const reportedById = userIds[t.reportedByEmail];
    if (!reportedById) {
      console.log(`  – skip ticket ${t.id} → reporter not found`);
      continue;
    }

    let residentId: string | undefined;
    if (t.residentEmail) {
      const res = await prisma.resident.findFirst({
        where: { user: { email: t.residentEmail }, unitId },
      });
      residentId = res?.id;
    }

    const assignedToId = t.assignedToEmail
      ? userIds[t.assignedToEmail]
      : undefined;

    await prisma.maintenanceTicket.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        status: t.status,
        unitId,
        residentId,
        reportedById,
        assignedToId,
        note: t.note,
        resolvedAt: t.resolvedAt,
        createdAt: t.createdAt,
      },
      update: {
        status: t.status,
        assignedToId,
        note: t.note,
        resolvedAt: t.resolvedAt,
      },
    });

    // Seed logs: delete existing then recreate
    if (t.logs && t.logs.length > 0) {
      await prisma.maintenanceTicketLog.deleteMany({
        where: { ticketId: t.id },
      });
      for (const log of t.logs) {
        const logUserId = userIds[log.byEmail];
        if (!logUserId) continue;
        await prisma.maintenanceTicketLog.create({
          data: {
            ticketId: t.id,
            userId: logUserId,
            action: log.action,
            oldValue: log.oldValue ?? null,
            newValue: log.newValue ?? null,
            createdAt: new Date(t.createdAt.getTime() + log.offsetMs),
          },
        });
      }
    }

    console.log(
      `  ✓ [${t.status.padEnd(11)}] ${t.title} (${t.logs?.length ?? 0} logs)`,
    );
  }

  console.log('\nDone.');
  console.log(`  Users:         ${Object.keys(userIds).length}`);
  console.log(`  Floors:        ${floorIds.length}`);
  const unitTotal = floorIds.length * unitDefs.length;
  console.log(`  Units:         ${unitTotal} (${unitDefs.length}/floor)`);
  console.log(`  Announcements: ${announcementDefs.length}`);
  console.log(`  Visitors:      ${visitorDefs.length}`);
  console.log(`  Tickets:       ${ticketDefs.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
