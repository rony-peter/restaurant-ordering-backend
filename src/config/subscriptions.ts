import { SubscriptionTier } from "@prisma/client";

export interface TierConfig {
  maxStaff: number;
  maxTables: number;
  maxMenuItems: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierConfig> = {
  FREE: {
    maxStaff: 1,
    maxTables: 3,
    maxMenuItems: 15,
  },
  BASIC: {
    maxStaff: 3,
    maxTables: 10,
    maxMenuItems: 45,
  },
  PRO: {
    maxStaff: 10,
    maxTables: 30,
    maxMenuItems: 120,
  },
  ENTERPRISE: {
    maxStaff: Infinity,
    maxTables: Infinity,
    maxMenuItems: Infinity,
  },
};