import { Request, Response } from "express";
import { loginStaff } from "./auth.service.js"; // .js extension required for NodeNext
import { LoginRequestBody } from "./auth.types.js";

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