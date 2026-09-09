import Razorpay from "razorpay";
import crypto from "crypto";
import { PrismaClient, PaymentStatus, OrderStatus, TableStatus } from "@prisma/client";
import { getIO } from "../../websocket/socket.js";

const prisma = new PrismaClient();

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay API keys are missing from environment variables.");
  }

  return new Razorpay({ key_id, key_secret });
}

export async function createPaymentOrder(orderId: string, restaurantId: string) {
  const razorpay = getRazorpayInstance();

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: {
      items: {
        include: { menuItem: true },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found or unauthorized");
  }

  const totalAmount = order.items.reduce((sum, item) => {
    return sum + Number(item.menuItem.price) * item.quantity;
  }, 0);

  const amountInPaise = Math.round(totalAmount * 100);

  // Keep receipt length <= 40 chars
  const receipt = `rcpt_${order.id.slice(0, 30)}`;

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt,
    notes: {
      orderId,
      restaurantId,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orderId,
      amount: totalAmount,
      status: PaymentStatus.PENDING,
      gatewayRef: razorpayOrder.id,
    },
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    paymentId: payment.id,
  };
}

export async function handleRazorpayWebhook(payload: any, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error("Invalid webhook signature");
  }

  if (payload.event === "payment.captured") {
    const paymentEntity = payload.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;

    const payment = await prisma.payment.findFirst({
      where: { gatewayRef: razorpayOrderId },
      include: { order: true },
    });

    if (!payment || !payment.order) return;

    const { order } = payment;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.COMPLETED },
      });

      const orderRecord = await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAID },
        include: {
          table: true,
          items: {
            include: {
              menuItem: { select: { name: true, price: true } },
            },
          },
        },
      });

      if (order.tableId && order.restaurantId) {
        const activeOrdersCount = await tx.order.count({
          where: {
            tableId: order.tableId,
            status: { notIn: [OrderStatus.PAID] },
          },
        });

        if (activeOrdersCount === 0) {
          await tx.table.updateMany({
            where: {
              id: order.tableId,
              restaurantId: order.restaurantId,
            },
            data: { status: TableStatus.FREE },
          });
        }
      }

      return orderRecord;
    });

    try {
      getIO().to(`restaurant_${order.restaurantId}`).emit("order:updated", updatedOrder);
      getIO().to(`order_${order.id}`).emit("orderStatusChanged", updatedOrder);
    } catch (err) {
      console.error("Socket emission error in Razorpay webhook:", err);
    }
  }
}