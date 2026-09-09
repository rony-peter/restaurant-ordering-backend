import { Request, Response } from "express";
import { createPaymentOrder, handleRazorpayWebhook } from "./payment.service.js";

export async function createPaymentOrderHandler(req: Request, res: Response) {
  try {
    const { orderId, restaurantId } = req.body;

    if (!orderId || !restaurantId) {
      return res.status(400).json({ message: "orderId and restaurantId are required" });
    }

    const result = await createPaymentOrder(orderId, restaurantId);
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function razorpayWebhookHandler(req: Request, res: Response) {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      return res.status(400).json({ message: "Missing x-razorpay-signature header" });
    }

    await handleRazorpayWebhook(req.body, signature);
    return res.status(200).json({ status: "success" });
  } catch (error: any) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
}