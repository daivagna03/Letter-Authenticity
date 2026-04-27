import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const mla = await prisma.user.upsert({
    where: { email: 'mla@gov.in' },
    update: {
      designationType: 'Member of Parliament',
      houseType: 'Lok Sabha',
      constituency: 'Kandhamal',
      state: 'Odisha',
      defaultAddress: "D-6, Block-A, M.S. Flats 'Sindhu'\nBaba Kharak Singh Marg\nNew Delhi-110001",
    },
    create: {
      name: 'Pratyusha Rajeshwari Singh',
      email: 'mla@gov.in',
      mlaMpId: 'MP/Kandhamal/2026',
      passwordHash,
      role: Role.MLA,
      designationType: 'Member of Parliament',
      houseType: 'Lok Sabha',
      constituency: 'Kandhamal',
      state: 'Odisha',
      defaultAddress: "D-6, Block-A, M.S. Flats 'Sindhu'\nBaba Kharak Singh Marg\nNew Delhi-110001",
    },
  });

  console.log('Seeded initial MLA user:', mla.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
