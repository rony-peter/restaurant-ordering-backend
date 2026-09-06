import { Router } from "express";
import { authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  createTableHandler,
  getTablesHandler,
  getTableByQRHandler,
} from "./table.controller.js";

const router = Router();

// Public route: Customer scans QR token
router.get("/qr/:qrToken", getTableByQRHandler);

// Protected routes: Manager creates and views tables
router.post("/", authorizeRoles(["MANAGER", "ADMIN"]), createTableHandler);
router.get("/", authorizeRoles(["MANAGER", "ADMIN"]), getTablesHandler);

export default router;