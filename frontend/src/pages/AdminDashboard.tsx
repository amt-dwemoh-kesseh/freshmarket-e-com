import { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Users,
  ShoppingBag,
  X,
  Save,
} from "lucide-react";
import { InventoryItem, OrderAnalytics, Product, Order } from "../types";
import { api } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";

type TabType = "overview" | "products" | "orders";

export function AdminDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "",
    imageUrl: "",
  });

  useEffect(() => {
    loadData();
    loadProducts();
    loadOrders();

    // Set up auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      loadData();
      loadProducts();
      loadOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [inventoryData, analyticsData] = await Promise.all([
        api.getInventory(),
        api.getOrderAnalytics(),
      ]);
      setInventory(inventoryData);
      setAnalytics(analyticsData);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await api.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersData = await api.getAllOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error("Failed to load orders:", error);
      // Set empty array on error
      setOrders([]);
    }
  };

  const handleDispatchOrder = async (orderId: string) => {
    const trackingNumber = prompt("Enter tracking number (optional):");
    const courier = prompt("Enter courier name (optional):");

    try {
      await api.dispatchOrder(
        orderId,
        trackingNumber || undefined,
        courier || undefined
      );
      // Reload orders to reflect changes
      await loadOrders();
      alert("Order dispatched successfully!");
    } catch (error) {
      console.error("Failed to dispatch order:", error);
      alert("Failed to dispatch order. Please try again.");
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    if (window.confirm("Mark this order as delivered and completed?")) {
      try {
        await api.deliverOrder(orderId);
        // Reload orders and analytics to reflect changes
        await Promise.all([loadOrders(), loadData()]);
        alert("Order marked as delivered and completed!");
      } catch (error) {
        console.error("Failed to deliver order:", error);
        alert("Failed to mark order as delivered. Please try again.");
      }
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setUploadMethod("url");
    setSelectedFile(null);
    setUploading(false);
    setProductForm({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      imageUrl: "",
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setUploadMethod("url");
    setSelectedFile(null);
    setUploading(false);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl,
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(
          `http://localhost:3003/admin/products/${productId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete product");
        }

        // Remove from local state
        setProducts(products.filter((p) => p.id !== productId));
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.category) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setUploading(true);

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("name", productForm.name);
      formData.append("description", productForm.description);
      formData.append("price", productForm.price.toString());
      formData.append("stock", productForm.stock.toString());
      formData.append("category", productForm.category);

      // Add image - either file upload or URL
      if (uploadMethod === "file" && selectedFile) {
        formData.append("image", selectedFile);
      } else if (uploadMethod === "url" && productForm.imageUrl) {
        formData.append("imageUrl", productForm.imageUrl);
      }

      let response;
      if (editingProduct) {
        // Update existing product
        response = await fetch(
          `http://localhost:3003/admin/products/${editingProduct.id}`,
          {
            method: "PUT",
            body: formData,
          }
        );
      } else {
        // Create new product
        response = await fetch("http://localhost:3003/admin/products", {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      const savedProduct = await response.json();

      if (editingProduct) {
        // Update existing product in state
        setProducts(
          products.map((p) => (p.id === editingProduct.id ? savedProduct : p))
        );
      } else {
        // Add new product to state
        setProducts([...products, savedProduct]);
      }

      setShowProductModal(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFormChange = (field: string, value: string | number) => {
    setProductForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ErrorMessage
          message={error || "Failed to load data"}
          onRetry={loadData}
        />
      </div>
    );
  }

  const categories = [
    "all",
    ...Array.from(new Set(inventory.map((item) => item.category))),
  ];
  const filteredInventory =
    filterCategory === "all"
      ? inventory
      : inventory.filter((item) => item.category === filterCategory);

  const lowStockItems = inventory.filter(
    (item) => item.stock < item.lowStockThreshold
  );
  const outOfStockItems = inventory.filter((item) => item.stock === 0);

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: TrendingUp },
    { id: "products" as TabType, label: "Products", icon: Package },
    { id: "orders" as TabType, label: "Customer Orders", icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage products, inventory, and monitor order performance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">
                  Total Products
                </span>
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.totalProducts}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">
                  Total Orders
                </span>
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.totalOrders}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">
                  Successful Orders
                </span>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.successfulOrders}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">
                  Failed Payments
                </span>
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.failedPayments}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">
                  Pending Orders
                </span>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.pendingOrders}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-6 h-6" />
                <span className="font-medium">Total Revenue</span>
              </div>
              <p className="text-4xl font-bold">
                ${analytics.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm mt-2 opacity-90">
                From all completed orders
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-6 h-6" />
                <span className="font-medium">Today's Revenue</span>
              </div>
              <p className="text-4xl font-bold">
                ${analytics.revenueToday.toLocaleString()}
              </p>
              <p className="text-sm mt-2 opacity-90">From today's orders</p>
            </div>

            <div className="bg-white rounded-lg border border-orange-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <span className="font-medium text-gray-900">
                  Low Stock Items
                </span>
              </div>
              <p className="text-4xl font-bold text-orange-600">
                {lowStockItems.length}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-red-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="font-medium text-gray-900">Out of Stock</span>
              </div>
              <p className="text-4xl font-bold text-red-600">
                {outOfStockItems.length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Inventory Management
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filterCategory === category
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category === "all" ? "All Categories" : category}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => {
                    const isOutOfStock = item.stock === 0;
                    const isLowStock =
                      item.stock < item.lowStockThreshold && item.stock > 0;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {item.productName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              isOutOfStock
                                ? "text-red-600"
                                : isLowStock
                                ? "text-orange-600"
                                : "text-gray-900"
                            }`}
                          >
                            {item.stock} units
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {item.soldCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOutOfStock ? (
                            <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "products" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Product Management
            </h2>
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {products.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No products added yet. Click "Add Product" to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-10 w-10 rounded-lg object-cover mr-3"
                            src={product.imageUrl || "/placeholder-product.jpg"}
                            alt={product.name}
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            product.stock === 0
                              ? "text-red-600"
                              : product.stock < 10
                              ? "text-orange-600"
                              : "text-gray-900"
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Customer Orders</h2>
            <ShoppingBag className="w-6 h-6 text-gray-600" />
          </div>

          {orders.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders
                    .filter((order) => order.paymentStatus === "SUCCESS")
                    .map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 text-xs">
                            {order.id.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.shippingAddress.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.shippingAddress.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.items.length} item
                            {order.items.length !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              order.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : order.status === "DISPATCHED"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "CONFIRMED"
                                ? "bg-purple-100 text-purple-800"
                                : order.status === "PAYMENT_SUCCESS"
                                ? "bg-teal-100 text-teal-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleDispatchOrder(order.id)}
                              className="text-blue-600 hover:text-blue-900 px-3 py-1 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                            >
                              Dispatch
                            </button>
                          )}
                          {order.status === "DISPATCHED" && (
                            <button
                              onClick={() => handleDeliverOrder(order.id)}
                              className="text-green-600 hover:text-green-900 px-3 py-1 border border-green-600 rounded hover:bg-green-50 transition-colors"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {order.status === "COMPLETED" && (
                            <span className="text-gray-400 text-xs">
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) =>
                      handleFormChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) =>
                        handleFormChange(
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.stock}
                      onChange={(e) =>
                        handleFormChange("stock", parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      handleFormChange("category", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select a category</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Meat">Meat</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image Upload Method
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value="url"
                        checked={uploadMethod === "url"}
                        onChange={(e) =>
                          setUploadMethod(e.target.value as "url" | "file")
                        }
                        className="mr-2"
                      />
                      Image URL
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value="file"
                        checked={uploadMethod === "file"}
                        onChange={(e) =>
                          setUploadMethod(e.target.value as "url" | "file")
                        }
                        className="mr-2"
                      />
                      Upload File
                    </label>
                  </div>

                  {uploadMethod === "url" ? (
                    <input
                      type="url"
                      value={productForm.imageUrl}
                      onChange={(e) =>
                        handleFormChange("imageUrl", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {uploading
                    ? "Uploading..."
                    : (editingProduct ? "Update" : "Add") + " Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
