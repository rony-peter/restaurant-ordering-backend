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

export interface LoginResponseData {
  token: string;
  staff: AuthUserPayload;
}

export interface RegisterRequestBody {
  email: string;
  password: string;
  role: StaffRole;
  restaurantId: string;
}