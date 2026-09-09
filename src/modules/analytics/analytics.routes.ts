import { Router } from "express";
import { authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  getOverviewHandler,
  getTopItemsHandler,
} from "./analytics.controller.js";

const router = Router();

// Admin routes for Dashboard Metrics
router.get(
  "/overview",
  authorizeRoles(["ADMIN"]),
  getOverviewHandler
);

router.get(
  "/top-items",
  authorizeRoles(["ADMIN"]),
  getTopItemsHandler
);

export default router;