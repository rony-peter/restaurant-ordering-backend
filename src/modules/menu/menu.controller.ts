import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
  createMenuItem,
  getMenuItems,
  toggleMenuItemAvailability,
  deleteMenuItem,
} from "./menu.service.js";

export async function createMenuItemHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const restaurantId = req.user?.restaurantId;
    const { name, price, category, description, imageUrl, dietaryTags } = req.body;

    if (!restaurantId || !name || price === undefined || !category) {
      return res.status(400).json({
        message: "name, price, and category are required fields",
      });
    }

    const menuItem = await createMenuItem(restaurantId, {
      name,
      price: Number(price),
      category,
      description,
      imageUrl,
      dietaryTags,
    });

    return res.status(201).json(menuItem);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getMenuItemsHandler(
  req: Request<{ restaurantId: string }>,
  res: Response
) {
  try {
    const { restaurantId } = req.params;
    const category = req.query.category as string | undefined;

    if (!restaurantId) {
      return res.status(400).json({ message: "restaurantId is required" });
    }

    const items = await getMenuItems(restaurantId, category);
    return res.status(200).json(items);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function toggleAvailabilityHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params as { id: string };
    const { isAvailable } = req.body;

    if (!restaurantId || !id || isAvailable === undefined) {
      return res.status(400).json({
        message: "Item ID and isAvailable status are required",
      });
    }

    await toggleMenuItemAvailability(id, restaurantId, Boolean(isAvailable));
    return res.status(200).json({ message: "Availability updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function deleteMenuItemHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params as { id: string };

    if (!restaurantId || !id) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    await deleteMenuItem(id, restaurantId);
    return res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}