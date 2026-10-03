import { TIER_LIMITS } from "../../config/subscriptions";
import { SubscriptionTier, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateMenuItemDto {
  name: string;
  price: number;
  category: string;
  description?: string | undefined;
  imageUrl?: string | undefined;
  dietaryTags?: string[] | undefined;
}

export async function getMenuItems(restaurantId: string) {
  return await prisma.menuItem.findMany({
    where: { restaurantId },
    orderBy: { category: "asc" },
  });
}

export async function createMenuItem(restaurantId: string, data: CreateMenuItemDto) {
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
  const maxMenuItems = TIER_LIMITS[tier]?.maxMenuItems ?? TIER_LIMITS.FREE.maxMenuItems;

  const currentCount = await prisma.menuItem.count({
    where: { restaurantId },
  });

  if (currentCount >= maxMenuItems) {
    throw new Error(
      `QUOTA_EXCEEDED: Your ${tier} plan allows a maximum of ${maxMenuItems} menu item(s). Please upgrade your subscription to add more.`
    );
  }

  return await prisma.menuItem.create({
    data: {
      restaurantId,
      name: data.name,
      price: data.price,
      category: data.category,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      isAvailable: true,
      dietaryTags: data.dietaryTags ?? [],
    },
  });
}

export async function deleteMenuItem(restaurantId: string, menuItemId: string) {
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
  });

  if (!menuItem) {
    throw new Error("Menu item not found.");
  }

  return await prisma.menuItem.delete({
    where: { id: menuItemId },
  });
}