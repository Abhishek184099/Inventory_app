import { Role  } from "../src/generated/prisma/client.js";
import bcrypt from 'bcrypt';
import { prisma } from "../src/lib/prisma.js";


async function main() {
  const adminEmail =  'admin@example.com';
  const adminPassword = 'password123';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`Admin already exists (${adminEmail}), skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Admin user created: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });