import { PrismaClient, StaffRole } from "@prisma/client";
import { hashPassword } from "../src/modules/auth/auth.service";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("Manager@123");

  const manager = await prisma.staff.create({
    data: {
      restaurantId: "d09bb546-699f-4449-9a02-b09b36907716",
      email: "manager@myrestaurant.com",
      passwordHash,
      role: StaffRole.MANAGER,
    },
  });

  console.log("Manager created:");
  console.log(manager);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });