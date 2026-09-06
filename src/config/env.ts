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

  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000"
};