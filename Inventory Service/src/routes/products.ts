import { Router } from "express";
import { prisma } from "../server";

const router = Router();

// GET /products - List products with filters
router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;

    let where: any = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice as string) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice as string) };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /products/:id - Get single product
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
