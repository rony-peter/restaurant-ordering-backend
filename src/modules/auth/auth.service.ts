import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StaffRole, SubscriptionTier, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { RegisterAdminDto, LoginInput, AuthResponse } from "./auth.types.js";

export async function registerAdmin(input: RegisterAdminDto): Promise<AuthResponse> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existingStaff = await prisma.staff.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingStaff) {
    throw new Error(`A user with email ${normalizedEmail} already exists.`);
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const settingsJson = {
    address: input.address?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    taxRate: input.taxRate ?? 0.05,
    currency: input.currency?.trim() ?? "INR",
  };

  // Atomic creation of Restaurant, ADMIN Staff account, and default FREE Subscription
  const result = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        name: input.restaurantName.trim(),
        settings: settingsJson,
      },
    });

    const staff = await tx.staff.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: StaffRole.ADMIN,
        restaurantId: restaurant.id,
      },
    });

    const subscription = await tx.subscription.create({
      data: {
        restaurantId: restaurant.id,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    return { staff, restaurant, subscription };
  });

  const jwtSecret = process.env.JWT_SECRET || "opsportal_secret_jwt_key";

  const token = jwt.sign(
    {
      id: result.staff.id,
      email: result.staff.email,
      role: result.staff.role,
      restaurantId: result.restaurant.id,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: result.staff.id,
      email: result.staff.email,
      role: result.staff.role,
      restaurantId: result.restaurant.id,
    },
    subscriptionTier: result.subscription.tier,
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const staff = await prisma.staff.findUnique({
    where: { email: normalizedEmail },
    include: { restaurant: { include: { subscription: true } } },
  });

  if (!staff || !(await bcrypt.compare(input.password, staff.passwordHash))) {
    throw new Error("Invalid email or password.");
  }

  const jwtSecret = process.env.JWT_SECRET || "opsportal_secret_jwt_key";

  const token = jwt.sign(
    {
      id: staff.id,
      email: staff.email,
      role: staff.role,
      restaurantId: staff.restaurantId,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: staff.id,
      email: staff.email,
      role: staff.role,
      restaurantId: staff.restaurantId,
    },
    subscriptionTier: staff.restaurant.subscription?.tier || SubscriptionTier.FREE,
  };
}