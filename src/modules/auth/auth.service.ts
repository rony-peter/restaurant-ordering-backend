import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterRequestBody } from "./auth.types.js";

const prisma = new PrismaClient();

export async function hashPassword(password: string): Promise<string> {
  const passwordHash = await bcrypt.hash(password, 10);
  return passwordHash;
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

  const token = jwt.sign(
    {
      id: staff.id,
      email: staff.email,
      role: staff.role,
      restaurantId: staff.restaurantId,
    },
    process.env.JWT_SECRET || "fallback_secret",
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

export async function registerStaff(body: RegisterRequestBody) {
  const { email, password, role, restaurantId } = body;

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
      restaurantId,
    },
  });

  return {
    id: staff.id,
    email: staff.email,
    role: staff.role,
    restaurantId: staff.restaurantId,
  };
}