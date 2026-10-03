import { StaffRole, SubscriptionTier } from "@prisma/client";

export interface RegisterAdminDto {
  restaurantName: string;
  address?: string | undefined;
  phone?: string | undefined;
  taxRate?: number | undefined;
  currency?: string | undefined;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: StaffRole;
    restaurantId: string;
  };
  subscriptionTier: SubscriptionTier;
}