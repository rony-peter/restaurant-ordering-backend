import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",

  PORT: Number(process.env.PORT ?? 4000),

  DATABASE_URL: getRequiredEnv("DATABASE_URL"),

  REDIS_URL: getRequiredEnv("REDIS_URL"),

  JWT_SECRET: getRequiredEnv("JWT_SECRET"),

  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",

  RAZORPAY_PLAN_BASIC: process.env.RAZORPAY_PLAN_BASIC ?? "plan_basic_default",
  RAZORPAY_PLAN_PRO: process.env.RAZORPAY_PLAN_PRO ?? "plan_pro_default",
  RAZORPAY_PLAN_ENTERPRISE: process.env.RAZORPAY_PLAN_ENTERPRISE ?? "plan_ent_default",
};