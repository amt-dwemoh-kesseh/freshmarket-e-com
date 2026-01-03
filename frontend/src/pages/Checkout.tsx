import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { ShippingAddress, Order, PaymentDetails } from "../types";

type CheckoutStep = "shipping" | "payment" | "review" | "complete";
type PaymentState = "idle" | "processing" | "success" | "failed";

export function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart, paymentDetails, savePaymentDetails } = useApp();
  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [orderId, setOrderId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  const [currentPaymentDetails, setCurrentPaymentDetails] =
    useState<PaymentDetails>({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    });

  // Load existing payment details on component mount
  useEffect(() => {
    if (paymentDetails) {
      setCurrentPaymentDetails(paymentDetails);
    }
  }, [paymentDetails]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save payment details to session
    savePaymentDetails(currentPaymentDetails);
    setStep("review");
  };

  const handlePlaceOrder = async () => {
    setPaymentState("processing");
    setErrorMessage("");

    try {
      const order = await api.createOrder(cart, shippingAddress);
      setOrderId(order.id);

      const paymentResult = await api.processPayment(order.id);

      if (paymentResult.success) {
        setPaymentState("success");
        clearCart();
        setTimeout(() => {
          setStep("complete");
        }, 2000);
      } else {
        setPaymentState("failed");
        setErrorMessage(paymentResult.message);
      }
    } catch (error) {
      setPaymentState("failed");
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  const handleRetryPayment = () => {
    setPaymentState("idle");
    setStep("review");
  };

  if (step === "complete") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Placed Successfully
          </h1>
          <p className="text-gray-600 mb-2">Thank you for your order!</p>
          <p className="text-sm text-gray-500 mb-8">Order ID: {orderId}</p>
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Track Your Order
          </button>
        </div>
      </div>
    );
  }

  if (paymentState !== "idle") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {paymentState === "processing" && (
            <div className="text-center">
              <Loader className="w-16 h-16 text-emerald-600 mx-auto mb-6 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Processing Payment
              </h2>
              <p className="text-gray-600">
                Please wait while we process your payment...
              </p>
            </div>
          )}

          {paymentState === "success" && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Successful
              </h2>
              <p className="text-gray-600">
                Redirecting to order confirmation...
              </p>
            </div>
          )}

          {paymentState === "failed" && (
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Failed
              </h2>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleRetryPayment}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back to Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Cart
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="flex gap-4 mb-8">
        <div
          className={`flex-1 h-2 rounded ${
            ["shipping", "payment", "review"].includes(step)
              ? "bg-emerald-600"
              : "bg-gray-200"
          }`}
        />
        <div
          className={`flex-1 h-2 rounded ${
            ["payment", "review"].includes(step)
              ? "bg-emerald-600"
              : "bg-gray-200"
          }`}
        />
        <div
          className={`flex-1 h-2 rounded ${
            step === "review" ? "bg-emerald-600" : "bg-gray-200"
          }`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === "shipping" && (
            <form
              onSubmit={handleShippingSubmit}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Shipping Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.addressLine1}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        addressLine1: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.addressLine2}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        addressLine2: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          city: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          state: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.zipCode}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          zipCode: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Continue to Payment
              </button>
            </form>
          )}

          {step === "payment" && (
            <form
              onSubmit={handlePaymentSubmit}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Payment Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={currentPaymentDetails.cardholderName}
                    onChange={(e) =>
                      setCurrentPaymentDetails({
                        ...currentPaymentDetails,
                        cardholderName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={currentPaymentDetails.cardNumber}
                    onChange={(e) =>
                      setCurrentPaymentDetails({
                        ...currentPaymentDetails,
                        cardNumber: e.target.value
                          .replace(/\s/g, "")
                          .replace(/(\d{4})/g, "$1 ")
                          .trim(),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      value={currentPaymentDetails.expiryDate}
                      onChange={(e) =>
                        setCurrentPaymentDetails({
                          ...currentPaymentDetails,
                          expiryDate: e.target.value
                            .replace(/\D/g, "")
                            .replace(/(\d{2})(\d{2})/, "$1/$2"),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      required
                      value={currentPaymentDetails.cvv}
                      onChange={(e) =>
                        setCurrentPaymentDetails({
                          ...currentPaymentDetails,
                          cvv: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setStep("shipping")}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back to Shipping
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Continue to Review
                </button>
              </div>
            </form>
          )}

          {step === "review" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Shipping Address
                </h2>
                <div className="text-gray-700 space-y-1">
                  <p className="font-medium">{shippingAddress.fullName}</p>
                  <p>{shippingAddress.addressLine1}</p>
                  {shippingAddress.addressLine2 && (
                    <p>{shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {shippingAddress.city}, {shippingAddress.state}{" "}
                    {shippingAddress.zipCode}
                  </p>
                  <p>{shippingAddress.phone}</p>
                </div>
                <button
                  onClick={() => setStep("shipping")}
                  className="mt-4 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Edit Address
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Order Items
                </h2>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-4">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Place Order & Pay ${total.toFixed(2)}
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
