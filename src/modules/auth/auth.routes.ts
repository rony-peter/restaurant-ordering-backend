import { Router } from "express";
import { authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  loginHandler,
  registerAdminHandler,
  registerStaffHandler,
} from "./auth.controller.js";

const router = Router();

// Public onboarding routes
router.post("/login", loginHandler);
router.post("/register-admin", registerAdminHandler);

// Protected: Only logged-in ADMIN can create staff for their restaurant
router.post(
  "/register-staff",
  authorizeRoles(["ADMIN"]),
  registerStaffHandler
);

export default router;