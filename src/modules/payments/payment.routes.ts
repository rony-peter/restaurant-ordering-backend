import { Router } from "express";
import {
  createPaymentIntentHandler,
  stripeWebhookHandler,
} from "./payment.controller.js";

const router = Router();

// Public route: Create payment intent for customer checkout
router.post("/checkout", createPaymentIntentHandler);

// Webhook endpoint for Stripe callbacks
router.post("/webhook", stripeWebhookHandler);

export default router;