import { Request, Response } from "express";
import * as MenuService from "./menu.service";

export async function getMenuItemsHandler(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: "Unauthorized: Missing restaurant ID." });
    }

    const menuItems = await MenuService.getMenuItems(restaurantId);
    return res.status(200).json(menuItems);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to fetch menu items." });
  }
}

export async function getMenuItemsByRestaurantHandler(req: Request, res: Response) {
  try {
    const rawRestaurantId = req.params.restaurantId;
    const restaurantId = Array.isArray(rawRestaurantId) ? rawRestaurantId[0] : rawRestaurantId;

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required." });
    }

    const menuItems = await MenuService.getMenuItems(restaurantId);
    return res.status(200).json(menuItems);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to fetch menu items." });
  }
}

export async function createMenuItemHandler(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: "Unauthorized: Missing restaurant ID." });
    }

    const { name, price, category, description, imageUrl, dietaryTags } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: "Name, price, and category are required." });
    }

    const menuItem = await MenuService.createMenuItem(restaurantId, {
      name: String(name).trim(),
      price: Number(price),
      category: String(category).trim(),
      ...(description?.trim() ? { description: String(description).trim() } : {}),
      ...(imageUrl?.trim() ? { imageUrl: String(imageUrl).trim() } : {}),
      ...(Array.isArray(dietaryTags) ? { dietaryTags } : {}),
    });

    return res.status(201).json(menuItem);
  } catch (error: any) {
    if (error.message?.startsWith("QUOTA_EXCEEDED")) {
      return res.status(403).json({
        message: error.message.replace("QUOTA_EXCEEDED: ", ""),
      });
    }

    return res.status(400).json({
      message: error.message || "Failed to create menu item.",
    });
  }
}

export async function deleteMenuItemHandler(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: "Unauthorized: Missing restaurant ID." });
    }

    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Menu item ID is required." });
    }

    await MenuService.deleteMenuItem(restaurantId, id);
    return res.status(200).json({ message: "Menu item deleted successfully." });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to delete menu item.",
    });
  }
}