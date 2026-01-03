import { Router } from "express";
import { prisma } from "../server";

const router = Router();

// GET /inventory - Get inventory data for admin
router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        soldCount: true,
        category: true,
      },
    });

    const inventory = products.map((product) => ({
      id: product.id,
      productName: product.name,
      stock: product.stock,
      soldCount: product.soldCount,
      lowStockThreshold: 20,
      category: product.category,
    }));

    res.json(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
