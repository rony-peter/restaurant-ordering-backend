import { PrismaClient, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterStaffRequestBody, RegisterAdminRequestBody } from "./auth.types.js";

const prisma = new PrismaClient();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function loginStaff(email: string, passwordInput: string) {
  const staff = await prisma.staff.findFirst({
    where: { email },
  });

  if (!staff) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await comparePassword(passwordInput, staff.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Server misconfiguration: Missing JWT secret");
  }

  const token = jwt.sign(
    {
      id: staff.id,
      email: staff.email,
      role: staff.role,
      restaurantId: staff.restaurantId,
    },
    jwtSecret,
    { expiresIn: "1d" }
  );

  return {
    token,
    staff: {
      id: staff.id,
      email: staff.email,
      role: staff.role,
      restaurantId: staff.restaurantId,
    },
  };
}

export async function registerAdmin(data: RegisterAdminRequestBody) {
  const existing = await prisma.staff.findFirst({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("Staff email already exists");
  }

  const passwordHash = await hashPassword(data.password);

  return prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: { name: data.restaurantName },
    });

    const staff = await tx.staff.create({
      data: {
        email: data.email,
        passwordHash,
        role: StaffRole.ADMIN,
        restaurantId: restaurant.id,
      },
    });

    return {
      restaurant,
      staff: {
        id: staff.id,
        email: staff.email,
        role: staff.role,
        restaurantId: staff.restaurantId,
      },
    };
  });
}

export async function registerStaff(
  adminRestaurantId: string,
  body: RegisterStaffRequestBody
) {
  const { email, password, role } = body;

  if (role === StaffRole.ADMIN) {
    throw new Error("Cannot create ADMIN accounts via staff endpoint");
  }

  const existing = await prisma.staff.findFirst({
    where: { email },
  });

  if (existing) {
    throw new Error("Staff email already exists");
  }

  const passwordHash = await hashPassword(password);

  const staff = await prisma.staff.create({
    data: {
      email,
      passwordHash,
      role,
      restaurantId: adminRestaurantId,
    },
  });

  return {
    id: staff.id,
    email: staff.email,
    role: staff.role,
    restaurantId: staff.restaurantId,
  };
}