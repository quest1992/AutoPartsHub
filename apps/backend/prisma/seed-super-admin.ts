import 'dotenv/config';

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEVELOPMENT_ADMIN_PHONE = '+992900000000';
const DEVELOPMENT_ADMIN_PASSWORD = 'TempAdmin123!';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The development SUPER_ADMIN seed cannot run in production.');
  }

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
    select: { id: true },
  });

  if (existingSuperAdmin) {
    console.log('SUPER_ADMIN already exists. Seed skipped.');
    return;
  }

  const passwordHash = await bcrypt.hash(DEVELOPMENT_ADMIN_PASSWORD, 12);

  await prisma.user.create({
    data: {
      firstName: 'Development',
      lastName: 'Super Admin',
      phone: DEVELOPMENT_ADMIN_PHONE,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      shopId: null,
    },
  });

  console.log('Development SUPER_ADMIN created.');
  console.log(`Phone: ${DEVELOPMENT_ADMIN_PHONE}`);
  console.log(`Temporary password: ${DEVELOPMENT_ADMIN_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error('Failed to seed development SUPER_ADMIN.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
