import { Router } from "express";
import { authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  createMenuItemHandler,
  getMenuItemsHandler,
  toggleAvailabilityHandler,
  deleteMenuItemHandler,
} from "./menu.controller.js";

const router = Router();

// Public route: Customers fetching menu for a restaurant
router.get("/restaurant/:restaurantId", getMenuItemsHandler);

// Manager/Admin route: Create new menu item
router.post("/", authorizeRoles(["MANAGER", "ADMIN"]), createMenuItemHandler);

// Kitchen/Cook/Manager route: Toggle item availability
router.patch(
  "/:id/availability",
  authorizeRoles(["MANAGER", "ADMIN", "COOK"]),
  toggleAvailabilityHandler
);

// Manager/Admin route: Delete menu item
router.delete("/:id", authorizeRoles(["MANAGER", "ADMIN"]), deleteMenuItemHandler);

export default router;