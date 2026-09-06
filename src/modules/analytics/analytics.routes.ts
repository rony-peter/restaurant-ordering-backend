import { Router } from "express";
import { authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  getOverviewHandler,
  getTopItemsHandler,
} from "./analytics.controller.js";

const router = Router();

// Manager/Admin only routes for Dashboard Metrics
router.get(
  "/overview",
  authorizeRoles(["MANAGER", "ADMIN"]),
  getOverviewHandler
);

router.get(
  "/top-items",
  authorizeRoles(["MANAGER", "ADMIN"]),
  getTopItemsHandler
);

export default router;