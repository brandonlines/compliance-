import { prisma } from "../lib/db";
import { seedDatabase } from "../lib/workspace";

async function main() {
  await seedDatabase();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
