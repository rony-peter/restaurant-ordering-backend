import { Router } from "express";
import {
  createPaymentOrderHandler,
  razorpayWebhookHandler,
} from "./payment.controller.js";

const router = Router();

// Public route: Create payment order for customer checkout
router.post("/checkout", createPaymentOrderHandler);

// Webhook endpoint for Razorpay callbacks
router.post("/webhook", razorpayWebhookHandler);

export default router;