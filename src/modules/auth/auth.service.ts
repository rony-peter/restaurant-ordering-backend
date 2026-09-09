import { PrismaClient, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  RegisterStaffRequestBody,
  RegisterAdminRequestBody,
} from "./auth.types.js";

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
  const normalizedEmail = email.toLowerCase().trim();
  const staff = await prisma.staff.findFirst({
    where: { email: normalizedEmail },
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
    { expiresIn: "7d" }
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
  const adminEmail = data.email.toLowerCase().trim();

  // 1. Verify main admin email isn't already taken
  const existingAdmin = await prisma.staff.findFirst({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    throw new Error("A staff user with this email already exists");
  }

  // 2. Hash main admin password
  const adminPasswordHash = await hashPassword(data.password);

  // 3. Prepare initial staff hashes if provided
  const preparedInitialStaff = data.initialStaff
    ? await Promise.all(
        data.initialStaff.map(async (s) => ({
          email: s.email.toLowerCase().trim(),
          passwordHash: await hashPassword(s.password),
          role: s.role,
        }))
      )
    : [];

  // 4. Create Restaurant and Staff in an atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        name: data.restaurantName.trim(),
        settings: {
          address: data.address || "",
          phone: data.phone || "",
          taxRate: data.taxRate ?? 0.05,
        },
        staff: {
          create: [
            {
              email: adminEmail,
              passwordHash: adminPasswordHash,
              role: StaffRole.ADMIN,
            },
            ...preparedInitialStaff,
          ],
        },
      },
      include: {
        staff: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    return restaurant;
  });

  const mainAdmin = result.staff.find((s) => s.email === adminEmail)!;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Server misconfiguration: Missing JWT secret");
  }

  // Generate token for auto-login after onboarding registration
  const token = jwt.sign(
    {
      id: mainAdmin.id,
      email: mainAdmin.email,
      role: mainAdmin.role,
      restaurantId: result.id,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );

  return {
    token,
    restaurant: {
      id: result.id,
      name: result.name,
      settings: result.settings,
    },
    staff: result.staff,
  };
}

export async function registerStaff(
  adminRestaurantId: string,
  body: RegisterStaffRequestBody
) {
  const { email, password, role } = body;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.staff.findFirst({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new Error("Staff email already exists");
  }

  const passwordHash = await hashPassword(password);

  const staff = await prisma.staff.create({
    data: {
      email: normalizedEmail,
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
    createdAt: staff.createdAt,
  };
}

export async function getStaffList(restaurantId: string) {
  return prisma.staff.findMany({
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

export async function deleteStaff(staffId: string, restaurantId: string) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, restaurantId },
  });

  if (!staff) {
    throw new Error("Staff member not found or access denied");
  }

  if (staff.role === StaffRole.ADMIN) {
    const adminCount = await prisma.staff.count({
      where: { restaurantId, role: StaffRole.ADMIN },
    });
    if (adminCount <= 1) {
      throw new Error("Cannot delete the last remaining ADMIN of the restaurant");
    }
  }

  return prisma.staff.delete({
    where: { id: staffId },
  });
}