import { SubscriptionTier, SubscriptionStatus } from "@prisma/client";

export interface PlanLimits {
  maxTables: number;
  maxStaff: number;
  maxMenuItems: number;
  hasAnalytics: boolean;
  hasKds: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  FREE: { maxTables: 3, maxStaff: 1, maxMenuItems: 15, hasAnalytics: false, hasKds: false },
  BASIC: { maxTables: 10, maxStaff: 3, maxMenuItems: 45, hasAnalytics: false, hasKds: true },
  PRO: { maxTables: 30, maxStaff: 10, maxMenuItems: 120, hasAnalytics: true, hasKds: true },
  ENTERPRISE: { maxTables: 999999, maxStaff: 999999, maxMenuItems: 999999, hasAnalytics: true, hasKds: true },
};