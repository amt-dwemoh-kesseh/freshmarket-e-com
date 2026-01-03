import { ShoppingCart, AlertCircle } from "lucide-react";
import { Product } from "../types";
import { useApp } from "../context/AppContext";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  isAdmin?: boolean;
}

export function ProductCard({
  product,
  onClick,
  isAdmin = false,
}: ProductCardProps) {
  const { addToCart } = useApp();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  };

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 20;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
              Out of Stock
            </span>
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Low Stock
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-1">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-emerald-600">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-sm text-gray-600">
            {isOutOfStock ? "Out of stock" : `In stock: ${product.stock}`}
          </span>
        </div>

        {!isAdmin && (
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        )}
      </div>
    </div>
  );
}
