import { PrismaClient, PaymentStatus, OrderStatus, TableStatus } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

export async function createPaymentIntent(orderId: string, restaurantId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: {
      items: {
        include: { menuItem: true },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const totalAmount = order.items.reduce((sum, item) => {
    return sum + Number(item.menuItem.price) * item.quantity;
  }, 0);

  const amountInCents = Math.round(totalAmount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: {
      orderId,
      restaurantId,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orderId,
      amount: totalAmount,
      status: PaymentStatus.PENDING,
      gatewayRef: paymentIntent.id,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: payment.id,
  };
}

export async function handlePaymentSuccess(gatewayRef: string) {
  const payment = await prisma.payment.findFirst({
    where: { gatewayRef },
  });

  if (!payment) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.COMPLETED },
  });

  const order = await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: OrderStatus.PAID },
  });

  await prisma.table.update({
    where: { id: order.tableId },
    data: { status: TableStatus.FREE },
  });
}