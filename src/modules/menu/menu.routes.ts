import { Router } from "express";
import {
  getMenuItemsHandler,
  getMenuItemsByRestaurantHandler,
  createMenuItemHandler,
  deleteMenuItemHandler,
} from "./menu.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getMenuItemsHandler);
router.get("/restaurant/:restaurantId", getMenuItemsByRestaurantHandler);
router.post("/", authenticate, createMenuItemHandler);
router.delete("/:id", authenticate, deleteMenuItemHandler);

export default router;