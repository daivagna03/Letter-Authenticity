import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateId } from '../src/lib/generateId';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@organization.com' },
    update: {
      designation: 'General Manager',
      department: 'Operations',
      organization: 'Acme Corp',
      defaultAddress: "123 Business Rd\nTech Park\nCity-100001",
    },
    create: {
      id: generateId(),
      name: 'John Doe',
      email: 'admin@organization.com',
      employeeId: 'EMP-001',
      passwordHash,
      role: Role.PRIMARY,
      designation: 'General Manager',
      department: 'Operations',
      organization: 'Acme Corp',
      defaultAddress: "123 Business Rd\nTech Park\nCity-100001",
    },
  });

  console.log('Seeded initial user:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
