import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { OrderStatus } from "@prisma/client";
import {
  createOrder,
  getRestaurantOrders,
  updateOrderStatus,
  getOrderReceipt,
  PaymentMethodType,
} from "./order.service.js";

export async function createOrderHandler(req: Request, res: Response) {
  try {
    const { restaurantId, tableId, items, notes, paymentMethod } = req.body;

    if (!restaurantId || !tableId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "restaurantId, tableId, and at least one order item are required",
      });
    }

    const validPaymentMethod: PaymentMethodType =
      paymentMethod === "ONLINE" ? "ONLINE" : "PAY_AT_TABLE";

    const order = await createOrder(
      restaurantId,
      tableId,
      items,
      notes,
      validPaymentMethod
    );

    return res.status(201).json(order);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export const getOrdersHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(403).json({ message: "Forbidden: User has no restaurant assigned" });
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
      return res.status(400).json({ message: "Order ID and new status are required" });
    }

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ message: "Invalid order status value" });
    }

    const updatedOrder = await updateOrderStatus(id, restaurantId, status as OrderStatus);

    return res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getReceiptHandler(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { restaurantId } = req.query as { restaurantId: string };

    if (!id || !restaurantId) {
      return res.status(400).json({ message: "Order ID and restaurantId are required" });
    }

    const receipt = await getOrderReceipt(id, restaurantId);
    return res.status(200).json(receipt);
  } catch (error: any) {
    return res.status(404).json({ message: error.message || "Receipt not found" });
  }
}