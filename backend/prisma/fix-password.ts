import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Admin@123", 10);

  const result = await prisma.user.updateMany({
    where: { email: "admin@rms.com" },
    data: { password: hash },
  });

  console.log("Updated:", result.count);
  console.log("Login: admin@rms.com / Admin@123");
}

main()
  .finally(() => prisma.$disconnect());
