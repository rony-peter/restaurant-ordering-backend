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

export interface InitialStaffInput {
  email: string;
  password: string;
  role: StaffRole;
}

export interface RegisterAdminRequestBody {
  restaurantName: string;
  address?: string;
  phone?: string;
  taxRate?: number;
  email: string;
  password: string;
  initialStaff?: InitialStaffInput[];
}

export interface RegisterStaffRequestBody {
  email: string;
  password: string;
  role: StaffRole;
}