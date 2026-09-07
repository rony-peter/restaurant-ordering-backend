import { Request, Response } from "express";
import { loginStaff, registerStaff } from "./auth.service.js";
import { LoginRequestBody, RegisterRequestBody } from "./auth.types.js";

export async function loginHandler(
  req: Request<{}, {}, LoginRequestBody>,
  res: Response
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const data = await loginStaff(email, password);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(401).json({
      message: error.message || "Authentication failed",
    });
  }
}

export async function registerHandler(
  req: Request<{}, {}, RegisterRequestBody>,
  res: Response
) {
  try {
    const { email, password, role, restaurantId } = req.body;

    if (!email || !password || !restaurantId) {
      return res.status(400).json({
        message: "Email, password, and restaurantId are required",
      });
    }

    const staff = await registerStaff(req.body);
    return res.status(201).json({
      message: "Staff created successfully",
      staff,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Registration failed",
    });
  }
}