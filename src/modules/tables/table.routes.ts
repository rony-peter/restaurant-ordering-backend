import { Router } from "express";
import {
  getTablesHandler,
  createTableHandler,
  deleteTableHandler,
} from "./table.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getTablesHandler);
router.post("/", authenticate, createTableHandler);
router.delete("/:id", authenticate, deleteTableHandler);

export default router;