import { PrismaClient, OrderStatus } from "@prisma/client";
import { getIO } from "../../websocket/socket.js";

const prisma = new PrismaClient();

interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

// 1. Place a new order & notify kitchen display in real time
export async function createOrder(
  restaurantId: string,
  tableId: string,
  items: CreateOrderItemInput[]
) {
  const newOrder = await prisma.order.create({
    data: {
      restaurantId,
      tableId,
      status: OrderStatus.PLACED,
      items: {
        create: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes ?? null,
        })),
      },
    },
    include: {
      table: { select: { tableNumber: true } },
      items: {
        include: {
          menuItem: { select: { name: true, price: true } },
        },
      },
    },
  });

  // Broadcast to kitchen display for this specific restaurant
  try {
    getIO().to(`restaurant_${restaurantId}`).emit("order:created", newOrder);
  } catch (err) {
    console.error("Socket emission error:", err);
  }

  return newOrder;
}

// 2. Fetch all active orders
export async function getRestaurantOrders(
  restaurantId: string,
  status?: OrderStatus
) {
  return prisma.order.findMany({
    where: {
      restaurantId,
      ...(status ? { status } : {}),
    },
    include: {
      table: true,
      items: {
        include: {
          menuItem: { select: { name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// 3. Update order status & broadcast to both Kitchen and Customer rooms
export async function updateOrderStatus(
  orderId: string,
  restaurantId: string,
  status: OrderStatus
) {
  const updated = await prisma.order.updateMany({
    where: { id: orderId, restaurantId },
    data: { status },
  });

  try {
    // Broadcast status change to Kitchen/Staff board
    getIO().to(`restaurant_${restaurantId}`).emit("order:status_updated", {
      orderId,
      status,
    });

    // Broadcast status change to Customer PWA tracking screen
    getIO().to(`order_${orderId}`).emit("orderStatusChanged", {
      orderId,
      status,
    });
  } catch (err) {
    console.error("Socket emission error:", err);
  }

  return updated;
}