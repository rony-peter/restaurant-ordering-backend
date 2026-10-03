import { PrismaClient, SubscriptionTier, SubscriptionStatus } from "@prisma/client";
import crypto from "crypto";
import { TIER_LIMITS } from "./subscription.types";

const prisma = new PrismaClient();

export async function getCurrentSubscription(restaurantId: string) {
  let sub = await prisma.subscription.findUnique({
    where: { restaurantId },
  });

  if (!sub) {
    sub = await prisma.subscription.create({
      data: {
        restaurantId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  const [tablesCount, staffCount, menuItemsCount] = await Promise.all([
    prisma.table.count({ where: { restaurantId } }),
    prisma.staff.count({ where: { restaurantId } }),
    prisma.menuItem.count({ where: { restaurantId } }),
  ]);

  const limits = TIER_LIMITS[sub.tier];

  return {
    ...sub,
    limits,
    usage: {
      tablesCount,
      staffCount,
      menuItemsCount,
    },
  };
}

export async function initiateCheckout(restaurantId: string, tier: SubscriptionTier) {
  if (tier === SubscriptionTier.FREE) {
    throw new Error("Cannot checkout FREE tier.");
  }

  const activeSub = await prisma.subscription.findUnique({
    where: { restaurantId },
  });

  if (activeSub && activeSub.tier !== SubscriptionTier.FREE && activeSub.status === SubscriptionStatus.ACTIVE) {
    throw new Error("Restaurant already has an active paid subscription.");
  }

  const planEnvKey = `RAZORPAY_PLAN_${tier}`;
  const planId = process.env[planEnvKey];

  if (!planId) {
    throw new Error(`Razorpay Plan ID not configured for tier ${tier}`);
  }

  const razorpaySubscriptionId = `sub_${Date.now()}`;

  const updatedSub = await prisma.subscription.upsert({
    where: { restaurantId },
    update: {
      razorpayPlanId: planId,
      razorpaySubscriptionId,
      status: SubscriptionStatus.PENDING,
    },
    create: {
      restaurantId,
      tier,
      status: SubscriptionStatus.PENDING,
      razorpayPlanId: planId,
      razorpaySubscriptionId,
    },
  });

  return {
    subscriptionId: updatedSub.id,
    razorpaySubscriptionId,
    keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_key",
  };
}

export async function verifyPayment(
  restaurantId: string,
  razorpayPaymentId: string,
  razorpaySubscriptionId: string,
  razorpaySignature: string
) {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
    .digest("hex");

  if (secret && generatedSignature !== razorpaySignature) {
    throw new Error("Invalid Razorpay payment signature.");
  }

  const sub = await prisma.subscription.findUnique({ where: { restaurantId } });
  if (!sub || sub.razorpaySubscriptionId !== razorpaySubscriptionId) {
    throw new Error("Subscription mismatch or ownership verification failed.");
  }

  // Explicit type annotation fixes TS2322
  let tier: SubscriptionTier = SubscriptionTier.BASIC;
  if (sub.razorpayPlanId === process.env.RAZORPAY_PLAN_PRO) tier = SubscriptionTier.PRO;
  if (sub.razorpayPlanId === process.env.RAZORPAY_PLAN_ENTERPRISE) tier = SubscriptionTier.ENTERPRISE;

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);

  return await prisma.subscription.update({
    where: { restaurantId },
    data: {
      tier,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });
}

export async function handleWebhook(rawBody: Buffer, signature: string) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error("Invalid webhook signature.");
  }

  const event = JSON.parse(rawBody.toString());
  const payload = event.payload?.subscription?.entity;

  if (!payload) return;

  const razorpaySubId = payload.id;
  const sub = await prisma.subscription.findUnique({
    where: { razorpaySubscriptionId: razorpaySubId },
  });

  if (!sub) return;

  if (event.event === "subscription.activated" || event.event === "subscription.charged") {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(payload.current_start * 1000),
        currentPeriodEnd: new Date(payload.current_end * 1000),
      },
    });
  } else if (event.event === "subscription.halted") {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: SubscriptionStatus.HALTED },
    });
  }
}