import bcrypt from "bcrypt";
import { StaffRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { TIER_LIMITS } from "../../config/subscriptions";

export async function createStaffMember(
  restaurantId: string,
  email: string,
  password: string,
  role: StaffRole
) {
  // 1. Check if email is already registered
  const existingStaff = await prisma.staff.findUnique({ where: { email } });
  if (existingStaff) {
    throw new Error("Staff email already exists");
  }

  // 2. Fetch current subscription tier
  const subscription = await prisma.subscription.findUnique({
    where: { restaurantId },
  });

  const currentTier = subscription?.tier || "FREE";
  const maxAllowedStaff = TIER_LIMITS[currentTier].maxStaff;

  // 3. Count current staff for this restaurant
  const currentStaffCount = await prisma.staff.count({
    where: { restaurantId },
  });

  // 4. Block creation if quota is reached
  if (currentStaffCount >= maxAllowedStaff) {
    throw new Error(
      `QUOTA_EXCEEDED: Your ${currentTier} plan allows a maximum of ${maxAllowedStaff} staff account(s). Please upgrade your subscription to add more.`
    );
  }

  // 5. Hash password and save new staff member
  const passwordHash = await bcrypt.hash(password, 10);

  return await prisma.staff.create({
    data: {
      restaurantId,
      email,
      passwordHash,
      role,
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getStaffMembers(restaurantId: string) {
  return await prisma.staff.findMany({
    where: { restaurantId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteStaffMember(restaurantId: string, staffId: string) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, restaurantId },
  });

  if (!staff) {
    throw new Error("Staff member not found or unauthorized");
  }

  return await prisma.staff.delete({
    where: { id: staffId },
  });
}