import { Router } from "express";
import { authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  createOrderHandler,
  getOrdersHandler,
  updateOrderStatusHandler,
} from "./order.controller.js";

const router = Router();

// Public route: Customer places order from QR interface
router.post("/", createOrderHandler);

// Staff route: Fetch active orders (Kitchen Display / Manager)
router.get(
  "/",
  authorizeRoles(["MANAGER", "ADMIN", "COOK"]),
  getOrdersHandler
);

// Staff route: Advance order status
router.patch(
  "/:id/status",
  authorizeRoles(["MANAGER", "ADMIN", "COOK"]),
  updateOrderStatusHandler
);

export default router;