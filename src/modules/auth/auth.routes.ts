import { Router } from "express";
import { registerAdminHandler, loginHandler } from "./auth.controller.js";

const router = Router();

router.post("/register-admin", registerAdminHandler);
router.post("/login", loginHandler);

export default router;