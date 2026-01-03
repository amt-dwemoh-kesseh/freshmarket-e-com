import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  AlertCircle,
  Plus,
  Minus,
  CreditCard,
} from "lucide-react";
import { Product } from "../types";
import { api } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApp } from "../context/AppContext";

export function ProductDetails() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, cart } = useApp();
  const isAdmin = user?.role === "ADMIN";
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useApp();

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getProduct(productId);
      if (!data) {
        // If API returns null, create fallback product
        const fallbackProduct: Product = {
          id: productId,
          name: "Sample Product",
          description:
            "This is a sample product. The inventory service may not be running.",
          price: 9.99,
          stock: 10,
          category: "Sample",
          imageUrl: "https://via.placeholder.com/400x400?text=Product+Image",
        };
        setProduct(fallbackProduct);
        setError(null);
      } else {
        setProduct(data);
      }
    } catch (error) {
      console.error("API Error:", error);
      // For demo purposes, create a fallback product if API fails
      const fallbackProduct: Product = {
        id: productId,
        name: "Sample Product",
        description:
          "This is a sample product. The inventory service may not be running.",
        price: 9.99,
        stock: 10,
        category: "Sample",
        imageUrl: "https://via.placeholder.com/400x400?text=Product+Image",
      };
      setProduct(fallbackProduct);
      setError(null); // Clear error since we have fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product && product.stock >= quantity) {
      addToCart(product, quantity);
      setQuantity(1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ErrorMessage
          message={error || "Product not found"}
          onRetry={loadProduct}
        />
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 20;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-lg">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-2">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
              {product.category}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl font-bold text-emerald-600">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">
              {isOutOfStock ? (
                <span className="text-red-600 font-medium">Out of stock</span>
              ) : (
                <>
                  <span className="font-medium">{product.stock} units</span>{" "}
                  available
                </>
              )}
            </span>
            {isLowStock && !isOutOfStock && (
              <span className="flex items-center gap-1 text-orange-600 text-sm font-medium ml-2">
                <AlertCircle className="w-4 h-4" />
                Low stock
              </span>
            )}
          </div>

          <div className="border-t border-b border-gray-200 py-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {!isAdmin && !isOutOfStock && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-xl font-semibold text-gray-900 w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-lg transition-colors ${
                  isOutOfStock
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>

              {!isOutOfStock && cart.length > 0 && (
                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  Proceed to Checkout ({cart.length} item{cart.length !== 1 ? 's' : ''})
                </button>
              )}

              {!isOutOfStock && cart.length === 0 && (
                <p className="text-center text-gray-500 text-sm">
                  Add this item to cart to proceed to checkout
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
