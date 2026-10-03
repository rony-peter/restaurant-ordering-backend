import { Router } from "express";
import { createStaffHandler, getStaffHandler, deleteStaffHandler } from "./staff.controller";
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getStaffHandler);
router.post("/", authorizeRoles(["ADMIN"]), createStaffHandler);
router.delete("/:id", deleteStaffHandler);

export default router;