import 'dotenv/config';
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";


// Pass the datasource URL explicitly to the custom generated client
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = ['admin', 'user'];

  console.log('--- Starting Seed ---');

  for (const roleName of roles) {
    const result = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    console.log(`Synced role: ${result.name}`);
  }
}

main()
  .then(async () => {
    console.log('--- Seeding Success ---');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('--- Seeding Error ---');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });