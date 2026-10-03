import { Request, Response } from "express";
import * as AuthService from "./auth.service.js";

export async function registerAdminHandler(req: Request, res: Response) {
  try {
    const { restaurantName, address, phone, taxRate, currency, email, password } = req.body;

    if (!restaurantName || !email || !password) {
      return res.status(400).json({
        message: "Restaurant name, email, and password are required.",
      });
    }

    const authData = await AuthService.registerAdmin({
      restaurantName: String(restaurantName).trim(),
      ...(address ? { address: String(address).trim() } : {}),
      ...(phone ? { phone: String(phone).trim() } : {}),
      ...(taxRate !== undefined ? { taxRate: Number(taxRate) } : {}),
      ...(currency ? { currency: String(currency).trim() } : {}),
      email: String(email).trim(),
      password: String(password),
    });

    return res.status(201).json(authData);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Registration failed." });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const authData = await AuthService.loginUser({
      email: String(email).trim(),
      password: String(password),
    });

    return res.json(authData);
  } catch (error: any) {
    return res.status(401).json({ message: error.message || "Authentication failed." });
  }
}