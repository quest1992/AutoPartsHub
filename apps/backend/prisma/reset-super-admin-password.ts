import 'dotenv/config';

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const TEMPORARY_PASSWORD = 'TempAdmin123!';
const SELECTED_SUPER_ADMIN_ID = '41b5e31c-93e0-48cc-b1f6-926cecd53d76';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'The development SUPER_ADMIN password reset cannot run in production.',
    );
  }

  const superAdmin = await prisma.user.findFirst({
    where: {
      id: SELECTED_SUPER_ADMIN_ID,
      role: UserRole.SUPER_ADMIN,
    },
    select: {
      id: true,
      phone: true,
      isActive: true,
      shopId: true,
    },
  });

  if (!superAdmin) {
    throw new Error(
      'Selected SUPER_ADMIN was not found. No password was changed.',
    );
  }

  const passwordHash = await bcrypt.hash(TEMPORARY_PASSWORD, 12);

  const updatedSuperAdmin = await prisma.user.update({
    where: { id: superAdmin.id },
    data: {
      isActive: true,
      shopId: null,
      passwordHash,
    },
    select: {
      id: true,
      phone: true,
      isActive: true,
    },
  });

  console.log('SUPER_ADMIN password was reset.');
  console.log(`ID: ${updatedSuperAdmin.id}`);
  console.log(`Phone: ${updatedSuperAdmin.phone}`);
  console.log(`isActive: ${updatedSuperAdmin.isActive}`);
  console.log(`Temporary password: ${TEMPORARY_PASSWORD}`);
  console.log('Change the password after signing in.');
}

main()
  .catch((error: unknown) => {
    console.error('Failed to reset development SUPER_ADMIN password.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
