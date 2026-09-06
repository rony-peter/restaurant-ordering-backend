import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createRestaurant(name: string) {
  const restaurant = await prisma.restaurant.create({
    data: {
      name,
    },
  });

  return restaurant;
}