import { PrismaClient, Role, Mode } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateId } from '../src/lib/generateId';

const prisma = new PrismaClient();

async function main() {
  // ── Seed Templates ─────────────────────────────────────────────────────────
  const templates = [
    {
      id: 'tmpl-general',
      slug: 'general',
      name: 'General Letter',
      mode: null,
      description: 'Standard official letter with formal letterhead, body, and signature block.',
      sortOrder: 1,
    },
    {
      id: 'tmpl-state-central',
      slug: 'state-central',
      name: 'State / Central Letter',
      mode: Mode.POLITICAL,
      description: 'Official letter with a "Copy to:" section below the signature for distribution.',
      sortOrder: 2,
    },
    {
      id: 'tmpl-district-order',
      slug: 'district-order',
      name: 'District Order',
      mode: Mode.POLITICAL,
      description: 'Government ORDER format with centered heading, Memo No., date, and numbered copy distribution list.',
      sortOrder: 3,
    },
    {
      id: 'tmpl-mplad',
      slug: 'mplad',
      name: 'MPLAD Letter',
      mode: Mode.POLITICAL,
      description: 'MP/MLA works recommendation letter with editable priority table and "Copy to:" section.',
      sortOrder: 4,
    },
  ];

  for (const tmpl of templates) {
    await prisma.template.upsert({
      where: { id: tmpl.id },
      update: {
        name: tmpl.name,
        description: tmpl.description,
        sortOrder: tmpl.sortOrder,
        mode: tmpl.mode,
      },
      create: tmpl,
    });
  }

  console.log('✅ Seeded 4 templates');

  // ── Seed Demo User (Organization mode) ────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@organization.com' },
    update: {},
    create: {
      id: generateId(),
      name: 'John Doe',
      email: 'admin@organization.com',
      employeeId: 'EMP-001',
      passwordHash,
      role: Role.MAIN_USER,
      mode: Mode.ORGANIZATION,
      designation: 'General Manager',
      department: 'Operations',
      organization: 'Acme Corp',
      defaultAddress: "123 Business Rd\nTech Park\nCity-100001",
    },
  });

  console.log('✅ Seeded demo user: admin@organization.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
