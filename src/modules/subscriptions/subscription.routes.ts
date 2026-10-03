import { Router } from "express";
import {
  getCurrentSubscriptionHandler,
  initiateCheckoutHandler,
  verifyPaymentHandler,
} from "./subscription.controller";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/current", authenticate, getCurrentSubscriptionHandler);
router.post("/checkout", authenticate, initiateCheckoutHandler);
router.post("/verify", authenticate, verifyPaymentHandler);

export default router;