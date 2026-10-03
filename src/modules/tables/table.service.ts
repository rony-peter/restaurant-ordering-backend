import { randomUUID } from "crypto";
import { TIER_LIMITS } from "../../config/subscriptions";
import { SubscriptionTier, TableStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getTables(restaurantId: string) {
  return await prisma.table.findMany({
    where: { restaurantId },
    orderBy: { tableNumber: "asc" },
  });
}

export async function createTable(restaurantId: string, number: string, _capacity?: number) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      subscription: {
        select: { tier: true },
      },
    },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found.");
  }

  const tier = (restaurant.subscription?.tier || "FREE") as SubscriptionTier;
  const maxTables = TIER_LIMITS[tier]?.maxTables ?? TIER_LIMITS.FREE.maxTables;

  const currentCount = await prisma.table.count({
    where: { restaurantId },
  });

  if (currentCount >= maxTables) {
    throw new Error(
      `QUOTA_EXCEEDED: Your ${tier} plan allows a maximum of ${maxTables} table(s). Please upgrade your subscription to add more.`
    );
  }

  return await prisma.table.create({
    data: {
      restaurantId,
      tableNumber: number,
      qrCodeToken: randomUUID(),
      status: TableStatus.FREE,
    },
  });
}

export async function deleteTable(restaurantId: string, tableId: string) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
  });

  if (!table) {
    throw new Error("Table not found.");
  }

  return await prisma.table.delete({
    where: { id: tableId },
  });
}