import { PrismaClient, TableStatus, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  const passwordHash = await bcrypt.hash("admin123", 10);

  // 1. Create a Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "The Grand Diner",
      settings: {
        address: "123 Beach Road, Alappuzha",
        taxRate: 0.05,
        currency: "INR",
        phone: "+91 9876543210",
        gstin: "32AAAAA0000A1Z5",
      },
    },
  });

  // 2. Create Tables
  const table1 = await prisma.table.create({
    data: {
      restaurantId: restaurant.id,
      tableNumber: "T1",
      qrCodeToken: "qr-tbl-101-demo",
      status: TableStatus.FREE,
    },
  });

  // 3. Create Menu Items
  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        name: "Classic Cheeseburger",
        price: 249.0,
        category: "Mains",
        description: "Juicy beef patty with cheddar, lettuce, and special sauce.",
        isAvailable: true,
        dietaryTags: ["Non-Veg"],
      },
      {
        restaurantId: restaurant.id,
        name: "Paneer Tikka Roll",
        price: 180.0,
        category: "Starters",
        description: "Grilled cottage cheese wrapped in roomali roti.",
        isAvailable: true,
        dietaryTags: ["Veg"],
      },
      {
        restaurantId: restaurant.id,
        name: "Iced Cold Coffee",
        price: 120.0,
        category: "Beverages",
        description: "Brewed espresso blended with chilled milk and ice cream.",
        isAvailable: true,
        dietaryTags: ["Veg"],
      },
    ],
  });

  // 4. Create Staff Account
  await prisma.staff.create({
    data: {
      restaurantId: restaurant.id,
      email: "admin@granddiner.com",
      passwordHash: passwordHash, // bcrypt hash placeholder
      role: StaffRole.ADMIN,
    },
  });

  console.log("Seeding completed successfully!");
  console.log(`Restaurant ID: ${restaurant.id}`);
  console.log(`Table 1 QR Token: ${table1.qrCodeToken}`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });