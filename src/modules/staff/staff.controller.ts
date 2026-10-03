import { Request, Response } from "express";
import * as StaffService from "./staff.service";

export async function createStaffHandler(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required." });
    }

    const newStaff = await StaffService.createStaffMember(restaurantId, email, password, role);
    return res.status(201).json(newStaff);
  } catch (error: any) {
    if (error.message.startsWith("QUOTA_EXCEEDED")) {
      return res.status(403).json({
        message: error.message.replace("QUOTA_EXCEEDED: ", ""),
      });
    }

    return res.status(400).json({
      message: error.message || "Failed to create staff member.",
    });
  }
}

export async function getStaffHandler(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    const staffList = await StaffService.getStaffMembers(restaurantId);
    return res.status(200).json(staffList);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to fetch staff members." });
  }
}

export async function deleteStaffHandler(req: Request, res: Response) {
  try {
    const restaurantId = (req as any).user?.restaurantId;
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Valid Staff ID is required" });
    }

    await StaffService.deleteStaffMember(restaurantId, id);
    return res.status(200).json({ message: "Staff member deleted successfully" });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to delete staff member.",
    });
  }
}