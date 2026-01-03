import { Router } from "express";
import { prisma } from "../server";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Configure Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

// Configure multer to handle both file and non-file uploads
const upload = multer({
  dest: "uploads/",
});

const router = Router();

// POST /admin/products - Create new product (admin only)
router.post("/products", upload.any(), async (req, res) => {
  try {
    const { name, description, price, stock, category, imageUrl } = req.body;

    // Validate required fields
    if (!name || !price || !stock || !category) {
      return res.status(400).json({
        error:
          "Missing required fields: name, price, stock, category are required",
      });
    }

    // Check if either imageUrl or image file is provided
    const imageFile = (req.files as any[])?.find((file: any) => file.fieldname === 'image');
    if (!imageUrl && !imageFile) {
      return res.status(400).json({
        error: "Either imageUrl or image file must be provided",
      });
    }

    let finalImageUrl = imageUrl;

    // If image file uploaded, upload to Cloudinary
    if (imageFile) {
      const result = await cloudinary.uploader.upload(imageFile.path, {
        folder: `categories/${category.toLowerCase()}`,
        public_id: `${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
      });
      finalImageUrl = result.secure_url;
    }

    const product = await prisma.product.create({
      data: {
        id: Date.now().toString(),
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        imageUrl: finalImageUrl,
      },
    });

    res.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/products/:id - Update product (admin only)
router.put("/products/:id", upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, imageUrl } = req.body;

    // Validate required fields
    if (!name || !price || !stock || !category) {
      return res.status(400).json({
        error:
          "Missing required fields: name, price, stock, category are required",
      });
    }

    // Check if either imageUrl or image file is provided
    const imageFile = (req.files as any[])?.find((file: any) => file.fieldname === 'image');
    if (!imageUrl && !imageFile) {
      return res.status(400).json({
        error: "Either imageUrl or image file must be provided",
      });
    }

    let finalImageUrl = imageUrl;

    // If image file uploaded, upload to Cloudinary
    if (imageFile) {
      const result = await cloudinary.uploader.upload(imageFile.path, {
        folder: `categories/${category.toLowerCase()}`,
        public_id: `${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
      });
      finalImageUrl = result.secure_url;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        imageUrl: finalImageUrl,
      },
    });

    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/products/:id - Delete product (admin only)
router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/products/:id/stock - Update stock (admin only)
router.put("/products/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: { stock: parseInt(stock) },
    });

    res.json(product);
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
