import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { loginStaff, registerAdmin, registerStaff } from "./auth.service.js";
import {
  LoginRequestBody,
  RegisterAdminRequestBody,
  RegisterStaffRequestBody,
} from "./auth.types.js";

export async function loginHandler(
  req: Request<{}, {}, LoginRequestBody>,
  res: Response
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const data = await loginStaff(email, password);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(401).json({ message: error.message || "Authentication failed" });
  }
}

export async function registerAdminHandler(
  req: Request<{}, {}, RegisterAdminRequestBody>,
  res: Response
) {
  try {
    const { restaurantName, email, password } = req.body;

    if (!restaurantName || !email || !password) {
      return res.status(400).json({ message: "Restaurant name, email, and password are required" });
    }

    const result = await registerAdmin(req.body);
    return res.status(201).json({
      message: "Restaurant and Admin created successfully",
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Registration failed" });
  }
}

export async function registerStaffHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const adminRestaurantId = req.user?.restaurantId;
    const { email, password, role } = req.body as RegisterStaffRequestBody;

    if (!adminRestaurantId) {
      return res.status(403).json({ message: "Forbidden: No restaurant assigned to admin" });
    }

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required" });
    }

    const staff = await registerStaff(adminRestaurantId, { email, password, role });
    return res.status(201).json({
      message: "Staff member created successfully",
      staff,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Staff creation failed" });
  }
}