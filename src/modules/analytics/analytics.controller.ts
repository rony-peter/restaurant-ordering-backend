import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
  getDashboardOverview,
  getTopSellingItems,
} from "./analytics.service.js";

export async function getOverviewHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID missing" });
    }

    const overview = await getDashboardOverview(restaurantId);
    return res.status(200).json(overview);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getTopItemsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const restaurantId = req.user?.restaurantId;
    const limit = req.query.limit ? Number(req.query.limit) : 5;

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID missing" });
    }

    const topItems = await getTopSellingItems(restaurantId, limit);
    return res.status(200).json(topItems);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}