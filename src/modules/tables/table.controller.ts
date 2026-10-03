import { Request, Response } from "express";
import * as TableService from "./table.service";

export async function getTablesHandler(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: "Unauthorized: Missing restaurant ID." });
    }

    const tables = await TableService.getTables(restaurantId);
    return res.status(200).json(tables);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to fetch tables." });
  }
}

export async function createTableHandler(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: "Unauthorized: Missing restaurant ID." });
    }

    // Accepts tableNumber (frontend payload) or number
    const { tableNumber, number, capacity } = req.body;
    const rawNumber = tableNumber || number;

    if (!rawNumber) {
      return res.status(400).json({ message: "Table number is required." });
    }

    const table = await TableService.createTable(
      restaurantId,
      String(rawNumber).trim(),
      capacity ? Number(capacity) : undefined
    );
    return res.status(201).json(table);
  } catch (error: any) {
    if (error.message?.startsWith("QUOTA_EXCEEDED")) {
      return res.status(403).json({
        message: error.message.replace("QUOTA_EXCEEDED: ", ""),
      });
    }

    return res.status(400).json({
      message: error.message || "Failed to create table.",
    });
  }
}

export async function deleteTableHandler(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    if (!restaurantId) {
      return res.status(401).json({ message: "Unauthorized: Missing restaurant ID." });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Table ID is required." });
    }

    await TableService.deleteTable(restaurantId, id);
    return res.status(200).json({ message: "Table deleted successfully." });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to delete table.",
    });
  }
}