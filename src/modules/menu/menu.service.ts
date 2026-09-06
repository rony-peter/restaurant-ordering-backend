import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createMenuItem(
  restaurantId: string,
  data: {
    name: string;
    price: number;
    category: string;
    description?: string;
    imageUrl?: string;
    dietaryTags?: string[];
  }
) {
  return prisma.menuItem.create({
    data: {
      restaurantId,
      name: data.name,
      price: data.price,
      category: data.category,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      dietaryTags: data.dietaryTags || [],
    },
  });
}

export async function getMenuItems(restaurantId: string, category?: string) {
  return prisma.menuItem.findMany({
    where: {
      restaurantId,
      ...(category ? { category } : {}),
    },
    orderBy: { category: "asc" },
  });
}

export async function toggleMenuItemAvailability(
  id: string,
  restaurantId: string,
  isAvailable: boolean
) {
  return prisma.menuItem.updateMany({
    where: { id, restaurantId },
    data: { isAvailable },
  });
}

export async function deleteMenuItem(id: string, restaurantId: string) {
  return prisma.menuItem.deleteMany({
    where: { id, restaurantId },
  });
}