import {
  PrismaClient,
  OrderStatus,
  TableStatus,
  PaymentStatus,
} from "@prisma/client";
import { getIO } from "../../websocket/socket.js";

const prisma = new PrismaClient();

interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export type PaymentMethodType = "PAY_AT_TABLE" | "ONLINE";

// 1. Place a new order & notify kitchen display in real time
export async function createOrder(
  restaurantId: string,
  tableId: string,
  items: CreateOrderItemInput[],
  notes?: string,
  paymentMethod: PaymentMethodType = "PAY_AT_TABLE"
) {
  // Validate Table
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
  });

  if (!table) {
    throw new Error("Table does not belong to this restaurant");
  }

  // Fetch Menu Items to calculate total payment amount accurately
  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, restaurantId },
  });

  if (menuItems.length !== new Set(menuItemIds).size) {
    throw new Error("One or more menu items are invalid or do not belong to this restaurant");
  }

  const itemPriceMap = new Map(
    menuItems.map((item) => [item.id, Number(item.price)])
  );

  const totalAmount = items.reduce((sum, item) => {
    const price = itemPriceMap.get(item.menuItemId) ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const initialStatus =
    paymentMethod === "PAY_AT_TABLE"
      ? PaymentStatus.PENDING
      : ((PaymentStatus as any).INITIATED ?? PaymentStatus.PENDING);

  const newOrder = await prisma.$transaction(async (tx) => {
    await tx.table.update({
      where: { id: tableId },
      data: { status: TableStatus.OCCUPIED },
    });

    return tx.order.create({
      data: {
        restaurantId,
        tableId,
        notes: notes ?? null,
        status: OrderStatus.PLACED,
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes ?? null,
          })),
        },
        payments: {
          create: {
            amount: totalAmount,
            method: paymentMethod as any,
            status: initialStatus,
          },
        },
      },
      include: {
        table: { select: { tableNumber: true } },
        items: {
          include: {
            menuItem: { select: { name: true, price: true } },
          },
        },
        payments: true,
      },
    });
  });

  try {
    getIO().to(`restaurant_${restaurantId}`).emit("order:created", newOrder);
  } catch (err) {
    console.error("Socket emission error:", err);
  }

  return newOrder;
}

// 2. Fetch all active orders for a single restaurant
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
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// 3. Update order status & return updated record
export async function updateOrderStatus(
  orderId: string,
  restaurantId: string,
  status: OrderStatus
) {
  const existingOrder = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
  });

  if (!existingOrder) {
    throw new Error("Order not found or access denied");
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        table: true,
        items: {
          include: {
            menuItem: { select: { name: true, price: true } },
          },
        },
        payments: true,
      },
    });

    if (status === OrderStatus.PAID) {
      const activeOrdersCount = await tx.order.count({
        where: {
          tableId: order.tableId,
          status: {
            notIn: [OrderStatus.PAID],
          },
        },
      });

      if (activeOrdersCount === 0) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: TableStatus.FREE },
        });
      }
    }

    return order;
  });

  try {
    getIO().to(`restaurant_${restaurantId}`).emit("order:updated", updatedOrder);
    getIO().to(`order_${orderId}`).emit("orderStatusChanged", updatedOrder);
  } catch (err) {
    console.error("Socket emission error:", err);
  }

  return updatedOrder;
}

// 4. Generate structured receipt payload for PWA and SaaS
export async function getOrderReceipt(orderId: string, restaurantId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: {
      restaurant: true,
      table: true,
      payments: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Receipt not found for this order");
  }

  const settings = (order.restaurant?.settings as Record<string, any>) || {};
  const taxRate = settings.taxRate ?? 0.05;

  let subtotal = 0;
  const itemsBreakdown = order.items.map((item) => {
    const unitPrice = Number(item.menuItem.price);
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    return {
      name: item.menuItem.name,
      quantity: item.quantity,
      unitPrice,
      total: itemTotal,
      notes: (item as any).notes ?? null,
    };
  });

  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;
  const payment = order.payments[0] ?? null;

  return {
    receiptId: `REC-${order.id.slice(0, 8).toUpperCase()}`,
    restaurantName: order.restaurant?.name || "Restaurant",
    address: settings.address || "Main Dining Area",
    phone: settings.phone || "N/A",
    gstin: settings.gstin || "N/A",
    orderId: order.id,
    tableNumber: order.table.tableNumber,
    date: order.createdAt,
    status: order.status,
    notes: (order as any).notes ?? null,
    items: itemsBreakdown,
    summary: {
      subtotal,
      taxRate: taxRate * 100,
      taxAmount,
      grandTotal,
    },
    payment: payment
      ? {
          gatewayRef: payment.gatewayRef,
          status: payment.status,
          method: (payment as any).method ?? "PAY_AT_TABLE",
          amount: Number(payment.amount),
        }
      : null,
  };
}