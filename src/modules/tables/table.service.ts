import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

export async function createTable(restaurantId: string, tableNumber: string | number) {
  const qrCodeToken = randomBytes(16).toString("hex");

  return prisma.table.create({
    data: {
      restaurantId,
      tableNumber: String(tableNumber), // Ensures tableNumber is stored as String
      qrCodeToken,
    },
  });
}

export async function getRestaurantTables(restaurantId: string) {
  return prisma.table.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTableByQRToken(qrCodeToken: string) {
  const table = await prisma.table.findFirst({
    where: { qrCodeToken },
    include: {
      restaurant: {
        select: { id: true, name: true },
      },
    },
  });

  if (!table) {
    throw new Error("Invalid or expired QR code");
  }

  return table;
}

export async function deleteTable(id: string, restaurantId: string) {
  // Verify table exists and belongs to the specified restaurant
  const table = await prisma.table.findFirst({
    where: {
      id,
      restaurantId,
    },
  });

  if (!table) {
    throw new Error("Table not found");
  }

  // Delete table (associated orders cascade delete via Prisma schema)
  return prisma.table.delete({
    where: { id },
  });
}