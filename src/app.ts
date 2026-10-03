import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";
import tableRoutes from "./modules/tables/table.routes.js";
import menuRoutes from "./modules/menu/menu.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes.js";
import staffRoutes from "./modules/staff/staff.routes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/staff", staffRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});