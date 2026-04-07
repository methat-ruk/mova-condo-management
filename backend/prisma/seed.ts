import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

const SEED_USERS: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}[] = [
  {
    email: 'admin@condo.com',
    password: 'Admin1234',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
  },
  {
    email: 'manager@condo.com',
    password: 'Manager1234',
    firstName: 'Property',
    lastName: 'Manager',
    role: UserRole.PROPERTY_MANAGER,
  },
  {
    email: 'staff@condo.com',
    password: 'Staff1234',
    firstName: 'Staff',
    lastName: 'Member',
    role: UserRole.STAFF,
  },
  {
    email: 'resident@condo.com',
    password: 'Resident1234',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.RESIDENT,
  },
];

async function main() {
  console.log('Seeding users...');

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
    console.log(`  ✓ ${user.role.padEnd(16)} ${user.email}`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
