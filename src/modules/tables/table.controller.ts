import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
  createTable,
  getRestaurantTables,
  getTableByQRToken,
  deleteTable, // Import service method
} from "./table.service.js";

export async function createTableHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const restaurantId = req.user?.restaurantId;
    const { tableNumber } = req.body;

    if (!restaurantId || tableNumber === undefined || tableNumber === null) {
      return res
        .status(400)
        .json({ message: "Restaurant ID and tableNumber are required" });
    }

    const table = await createTable(restaurantId, String(tableNumber));
    return res.status(201).json(table);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}

export async function getTablesHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID missing" });
    }

    const tables = await getRestaurantTables(restaurantId);
    return res.status(200).json(tables);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getTableByQRHandler(
  req: Request<{ qrToken: string }>,
  res: Response
) {
  try {
    const { qrToken } = req.params;

    if (!qrToken) {
      return res.status(400).json({ message: "QR Token is required" });
    }

    const table = await getTableByQRToken(qrToken);
    return res.status(200).json(table);
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
}

// DELETE Handler
export async function deleteTableHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params as { id: string };

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID missing" });
    }

    if (!id) {
      return res.status(400).json({ message: "Table ID is required" });
    }

    await deleteTable(id, restaurantId);
    return res.status(200).json({ message: "Table deleted successfully" });
  } catch (error: any) {
    if (error.message === "Table not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
}