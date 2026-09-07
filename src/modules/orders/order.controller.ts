import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { OrderStatus } from "@prisma/client";
import {
  createOrder,
  getRestaurantOrders,
  updateOrderStatus,
} from "./order.service.js";

export async function createOrderHandler(req: Request, res: Response) {
  try {
    const { restaurantId, tableId, items } = req.body;

    if (!restaurantId || !tableId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "restaurantId, tableId, and at least one order item are required",
      });
    }

    const order = await createOrder(restaurantId, tableId, items);
    return res.status(201).json(order);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export const getOrdersHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Extract restaurantId from authenticated JWT user payload
    const restaurantId = req.user?.restaurantId || (req.query.restaurantId as string);

    if (!restaurantId) {
      return res.status(400).json({ message: "restaurantId is required" });
    }

    const orders = await getRestaurantOrders(restaurantId);
    return res.status(200).json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

export async function updateOrderStatusHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params as { id: string };
    const { status } = req.body;

    if (!restaurantId) {
      return res.status(403).json({ message: "Forbidden: User has no restaurant assigned" });
    }

    if (!id || !status) {
      return res.status(400).json({
        message: "Order ID and new status are required",
      });
    }

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ message: "Invalid order status value" });
    }

    await updateOrderStatus(id, restaurantId, status as OrderStatus);
    return res.status(200).json({ message: "Order status updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}