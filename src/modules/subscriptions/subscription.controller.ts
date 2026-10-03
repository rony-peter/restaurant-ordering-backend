import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import * as SubscriptionService from "./subscription.service.js";

export async function getCurrentSubscriptionHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID missing from user token." });
    }

    const data = await SubscriptionService.getCurrentSubscription(restaurantId);
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function initiateCheckoutHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const restaurantId = req.user?.restaurantId;
    const { tier } = req.body;

    if (!restaurantId) {
      return res.status(401).json({ message: "Unauthorized: Missing restaurant ID in token" });
    }

    const result = await SubscriptionService.initiateCheckout(restaurantId, tier);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}

export async function verifyPaymentHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(401).json({ message: "Unauthorized: Missing restaurant ID in token" });
    }

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

    const result = await SubscriptionService.verifyPayment(
      restaurantId,
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature
    );
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}

export async function webhookHandler(req: Request, res: Response) {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    await SubscriptionService.handleWebhook(req.body, signature);
    return res.status(200).json({ status: "ok" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}