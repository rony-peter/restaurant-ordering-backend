import { Response, NextFunction } from "express";
import { PrismaClient, SubscriptionTier, SubscriptionStatus } from "@prisma/client";
import { AuthenticatedRequest } from "./auth.middleware.js";
import { TIER_LIMITS } from "../modules/subscriptions/subscription.types.js";

const prisma = new PrismaClient();

export function enforceSubscriptionStatus() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(403).json({ message: "Forbidden: Restaurant identification missing" });
    }

    const sub = await prisma.subscription.findUnique({
      where: { restaurantId },
    });

    if (!sub) {
      return res.status(403).json({ message: "No active subscription record found" });
    }

    if (
      sub.status === SubscriptionStatus.HALTED ||
      sub.status === SubscriptionStatus.CANCELLED ||
      sub.status === SubscriptionStatus.EXPIRED ||
      sub.status === SubscriptionStatus.PAUSED
    ) {
      return res.status(402).json({
        code: "SUBSCRIPTION_INACTIVE",
        message: "Payment Required: Your subscription is inactive or cancelled. Please update billing to continue.",
      });
    }

    const now = new Date();
    if (sub.currentPeriodEnd && sub.currentPeriodEnd < now) {
      return res.status(402).json({
        code: "SUBSCRIPTION_EXPIRED",
        message: "Your subscription period has ended. Please renew your plan.",
      });
    }

    next();
  };
}

export function enforceResourceQuota(resource: "tables" | "staff" | "menuItems") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(403).json({ message: "Forbidden: Restaurant scope missing" });
    }

    const sub = await prisma.subscription.findUnique({
      where: { restaurantId },
    });

    const tier = sub?.tier ?? SubscriptionTier.FREE;
    const limits = TIER_LIMITS[tier];

    let currentCount = 0;
    let maxAllowed = 0;

    switch (resource) {
      case "tables":
        currentCount = await prisma.table.count({ where: { restaurantId } });
        maxAllowed = limits.maxTables;
        break;
      case "staff":
        currentCount = await prisma.staff.count({ where: { restaurantId } });
        maxAllowed = limits.maxStaff;
        break;
      case "menuItems":
        currentCount = await prisma.menuItem.count({ where: { restaurantId } });
        maxAllowed = limits.maxMenuItems;
        break;
    }

    if (currentCount >= maxAllowed) {
      return res.status(403).json({
        code: "PLAN_LIMIT_EXCEEDED",
        message: `Plan Limit Reached: Your ${tier} plan permits up to ${maxAllowed} ${resource}. Please upgrade to add more.`,
        limit: maxAllowed,
        current: currentCount,
      });
    }

    next();
  };
}

export function enforceFeatureAccess(feature: "hasKds" | "hasAnalytics") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(403).json({ message: "Forbidden: Restaurant scope missing" });
    }

    const sub = await prisma.subscription.findUnique({
      where: { restaurantId },
    });

    const tier = sub?.tier ?? SubscriptionTier.FREE;
    const hasAccess = TIER_LIMITS[tier][feature];

    if (!hasAccess) {
      return res.status(403).json({
        code: "FEATURE_RESTRICTED",
        message: `Feature Restricted: Your current ${tier} plan does not include access to ${
          feature === "hasKds" ? "Kitchen Display System (KDS)" : "Advanced Analytics"
        }. Please upgrade your plan.`,
      });
    }

    next();
  };
}