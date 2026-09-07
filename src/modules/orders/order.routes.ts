import { Router } from "express";
import { authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  createOrderHandler,
  getOrdersHandler,
  updateOrderStatusHandler,
} from "./order.controller.js";

const router = Router();

// Public route: Customer places order from QR mobile PWA
router.post("/", createOrderHandler);

// Protected Staff route: Fetch active orders for Web Portal (KDS/Manager/Admin)
router.get(
  "/",
  authorizeRoles(["MANAGER", "ADMIN", "COOK"]),
  getOrdersHandler
);

// Protected Staff route: Advance order status from Web Portal
router.patch(
  "/:id/status",
  authorizeRoles(["MANAGER", "ADMIN", "COOK"]),
  updateOrderStatusHandler
);

export default router;