import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    id: "1",
    name: "Organic Bananas",
    description:
      "Fresh organic bananas, rich in potassium and perfect for smoothies or snacks.",
    price: 2.99,
    stock: 45,
    category: "Fruits",
    imageUrl:
      "https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "2",
    name: "Whole Wheat Bread",
    description:
      "Freshly baked whole wheat bread with no artificial preservatives.",
    price: 3.49,
    stock: 28,
    category: "Bakery",
    imageUrl:
      "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "3",
    name: "Organic Milk",
    description: "Fresh organic whole milk from grass-fed cows.",
    price: 4.99,
    stock: 0,
    category: "Dairy",
    imageUrl:
      "https://images.pexels.com/photos/236010/pexels-photo-236010.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "4",
    name: "Free Range Eggs (12)",
    description: "A dozen fresh free-range eggs from local farms.",
    price: 5.49,
    stock: 67,
    category: "Dairy",
    imageUrl:
      "https://images.pexels.com/photos/1556707/pexels-photo-1556707.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "5",
    name: "Fresh Tomatoes",
    description: "Vine-ripened tomatoes perfect for salads and cooking.",
    price: 3.99,
    stock: 89,
    category: "Vegetables",
    imageUrl:
      "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "6",
    name: "Extra Virgin Olive Oil",
    description: "Premium cold-pressed extra virgin olive oil from Italy.",
    price: 12.99,
    stock: 23,
    category: "Pantry",
    imageUrl:
      "https://images.pexels.com/photos/33735/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "7",
    name: "Organic Spinach",
    description:
      "Fresh organic baby spinach leaves, pre-washed and ready to eat.",
    price: 4.29,
    stock: 12,
    category: "Vegetables",
    imageUrl:
      "https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "8",
    name: "Cheddar Cheese",
    description: "Sharp cheddar cheese aged to perfection.",
    price: 6.99,
    stock: 34,
    category: "Dairy",
    imageUrl:
      "https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "9",
    name: "Ground Coffee",
    description: "Premium arabica ground coffee, medium roast.",
    price: 9.99,
    stock: 56,
    category: "Beverages",
    imageUrl:
      "https://images.pexels.com/photos/13857385/pexels-photo-13857385.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "10",
    name: "Pasta Penne",
    description: "Italian durum wheat pasta, perfect for any sauce.",
    price: 2.49,
    stock: 0,
    category: "Pantry",
    imageUrl:
      "https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "11",
    name: "Wild Caught Salmon",
    description: "Fresh Atlantic salmon fillet, rich in omega-3.",
    price: 15.99,
    stock: 18,
    category: "Seafood",
    imageUrl:
      "https://images.pexels.com/photos/3296392/pexels-photo-3296392.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "12",
    name: "Greek Yogurt",
    description: "Creamy Greek yogurt with live active cultures.",
    price: 5.99,
    stock: 42,
    category: "Dairy",
    imageUrl:
      "https://images.pexels.com/photos/5945758/pexels-photo-5945758.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

async function main() {
  console.log("Seeding products...");

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  console.log("Seeding completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
