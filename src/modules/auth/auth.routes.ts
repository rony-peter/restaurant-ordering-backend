import { Router } from "express";
import { loginHandler } from "./auth.controller.js"; // .js extension required for NodeNext

const router = Router();

router.post("/login", loginHandler);

export default router;