import { Router } from "express";
import { prisma } from "../server";

const router = Router();

// GET /notifications - Get notifications for user
router.get("/", async (req, res) => {
  try {
    const userId = "user-1"; // TODO: Get from auth

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /notifications/:id/read - Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
