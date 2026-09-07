import { Router } from "express";
import { authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  createTableHandler,
  getTablesHandler,
  getTableByQRHandler,
  deleteTableHandler, // 1. Import handler
} from "./table.controller.js";

const router = Router();

// Public route: Customer scans QR token
router.get("/qr/:qrToken", getTableByQRHandler);

// Protected routes: Manager creates, views, and deletes tables
router.post("/", authorizeRoles(["MANAGER", "ADMIN"]), createTableHandler);
router.get("/", authorizeRoles(["MANAGER", "ADMIN"]), getTablesHandler);
router.delete("/:id", authorizeRoles(["MANAGER", "ADMIN"]), deleteTableHandler); // 2. Add DELETE route

export default router;