import { StaffRole } from "@prisma/client";

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  role: StaffRole;
  restaurantId: string;
}

export interface RegisterAdminRequestBody {
  restaurantName: string;
  email: string;
  password: string;
}

export interface RegisterStaffRequestBody {
  email: string;
  password: string;
  role: StaffRole;
}