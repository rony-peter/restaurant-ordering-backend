import { Router } from "express";
import { authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  loginHandler,
  registerAdminHandler,
  registerStaffHandler,
  getStaffHandler,
  deleteStaffHandler,
} from "./auth.controller.js";

const router = Router();

// Public onboarding routes
router.post("/login", loginHandler);
router.post("/register-admin", registerAdminHandler);

// Protected routes: Fetch, create, and delete staff
router.get(
  "/staff",
  authorizeRoles(["ADMIN", "MANAGER"]),
  getStaffHandler
);

router.post(
  "/register-staff",
  authorizeRoles(["ADMIN"]),
  registerStaffHandler
);

router.delete(
  "/staff/:id",
  authorizeRoles(["ADMIN"]),
  deleteStaffHandler
);

export default router;