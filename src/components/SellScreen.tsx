import { useState, useCallback } from "react";
import { useCart } from "../hooks/useCart";
import { BarcodeInput } from "./BarcodeInput";
import { Product, PaymentMethod } from "../types";
import { createSale } from "../lib/supabase";
import toast from "react-hot-toast";

interface SellScreenProps {
  onBack: () => void;
}

export function SellScreen({ onBack }: SellScreenProps) {
  const cart = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState("");

  const handleCheckout = useCallback(
    async (method: PaymentMethod) => {
      if (!cart.canCheckout || isProcessing) return;

      if (method === "cash") {
        setShowCashModal(true);
        return;
      }

      setIsProcessing(true);
      try {
        const saleItems = cart.items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.sellPrice,
          lineTotal: item.lineTotal,
        }));

        await createSale(
          {
            total: cart.total,
            paymentMethod: method,
          },
          saleItems
        );

        toast.success(
          method === "lankaqr"
            ? "LankaQR ගෙවීම සටහන් කරන ලදී"
            : "Card ගෙවීම සටහන් කරන ලදී"
        );
        cart.clearCart();
      } catch (err) {
        console.error("Checkout error:", err);
        toast.error("ගෙවීම සුරැකීමේදී දෝෂයක්. නැවත උත්සාහ කරන්න.");
      } finally {
        setIsProcessing(false);
      }
    },
    [cart, isProcessing]
  );

  const handleCashConfirm = useCallback(async () => {
    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < cart.total) {
      toast.error("ලබාගත් මුදල අවම වශයෙන් ගෙවිය යුතු මුදලට සමාන හෝ වැඩි විය යුතුය.");
      return;
    }

    const change = received - cart.total;
    setIsProcessing(true);
    setShowCashModal(false);

    try {
      const saleItems = cart.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellPrice,
        lineTotal: item.lineTotal,
      }));

      await createSale(
        {
          total: cart.total,
          paymentMethod: "cash",
          cashReceived: received,
          changeAmount: change,
        },
        saleItems
      );

      toast.success(`Cash ගෙවීම සටහන් කරන ලදී. Balance: Rs. ${change.toLocaleString()}`);
      setCashReceived("");
      cart.clearCart();
    } catch (err) {
      console.error("Cash checkout error:", err);
      toast.error("ගෙවීම සුරැකීමේදී දෝෂයක්. නැවත උත්සාහ කරන්න.");
    } finally {
      setIsProcessing(false);
    }
  }, [cart, cashReceived]);

  const handleAddProduct = useCallback(
    (product: Product) => {
      if (product.stockQty <= 0) {
        toast.error(`${product.name} — Stock නැත`);
        return;
      }
      cart.addItem(product);
      toast.success(`${product.name} එකතු කරන ලදී`);
    },
    [cart]
  );

  return (
    <div className="screen flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">විකුණුම්</h1>
          <span className="si-label">New Sale</span>
        </div>
        <button onClick={onBack} className="btn-primary !min-h-12 !px-4">
          <span>ආපසු</span>
          <span className="si-label">Back (Esc)</span>
        </button>
      </div>

      {/* Barcode Input */}
      <BarcodeInput onProductSelect={handleAddProduct} disabled={isProcessing} />

      {/* Cart */}
      <div className="card flex-1 flex flex-col min-h-[300px]">
        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg">බාර්කෝඩ් ස්කෑන් කරන්න හෝ නම type කරන්න</p>
            <span className="si-label">Scan barcode or type product name</span>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white border-b border-gray-200">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="py-3 px-4">භාණ්ඩය</th>
                    <th className="py-3 px-4 text-center">ප්‍රමාණය</th>
                    <th className="py-3 px-4 text-right">මිල</th>
                    <th className="py-3 px-4 text-right">එකතුව</th>
                    <th className="py-3 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.product.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="font-medium">{item.product.name}</div>
                        <span className="si-label">{item.product.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => cart.updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                          >
                            −
                          </button>
                          <span className="w-10 text-center font-semibold tabular">{item.quantity}</span>
                          <button
                            onClick={() => cart.updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                            disabled={item.quantity >= item.product.stockQty}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right tabular">Rs. {item.product.sellPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular">Rs. {item.lineTotal.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => cart.removeItem(item.product.id)}
                          className="w-8 h-8 rounded-lg text-danger hover:bg-red-50 flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total + Payment */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-gray-500">අයිතම {cart.itemCount} · </span>
                  <span className="text-gray-500">Items</span>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold tabular">Rs. {cart.total.toLocaleString()}</div>
                  <span className="si-label">Total</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleCheckout("cash")}
                  disabled={!cart.canCheckout || isProcessing}
                  className="btn-payment-cash disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg font-bold">Cash</span>
                  <span className="si-label !text-white/70">F3</span>
                </button>
                <button
                  onClick={() => handleCheckout("lankaqr")}
                  disabled={!cart.canCheckout || isProcessing}
                  className="btn-payment-lankaqr disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg font-bold">LankaQR</span>
                  <span className="si-label !text-white/70">F4</span>
                </button>
                <button
                  onClick={() => handleCheckout("card")}
                  disabled={!cart.canCheckout || isProcessing}
                  className="btn-payment-card disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg font-bold">Card</span>
                  <span className="si-label !text-white/70">F5</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cash Modal */}
      {showCashModal && (
        <div data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold mb-1">Cash ගෙවීම</h2>
            <span className="si-label mb-4 block">Cash Payment</span>

            <div className="text-center mb-6">
              <div className="text-sm text-gray-500">ගෙවිය යුතු මුදල</div>
              <div className="text-4xl font-bold tabular">Rs. {cart.total.toLocaleString()}</div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">ලබාගත් මුදල</label>
              <span className="si-label">Cash Received</span>
              <input
                type="number"
                inputMode="numeric"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                className="w-full h-14 px-4 text-2xl font-bold tabular border-2 border-gray-300 rounded-xl 
                           focus:border-black focus:ring-2 focus:ring-black"
                autoFocus
              />
            </div>

            {cashReceived && parseFloat(cashReceived) >= cart.total && (
              <div className="text-center mb-4 p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Balance</span>
                <div className="text-2xl font-bold text-success tabular">
                  Rs. {(parseFloat(cashReceived) - cart.total).toLocaleString()}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCashModal(false);
                  setCashReceived("");
                }}
                className="flex-1 btn-primary !bg-gray-200 !text-gray-800"
              >
                අවලංගු
                <span className="si-label">Cancel</span>
              </button>
              <button
                onClick={handleCashConfirm}
                disabled={isProcessing}
                className="flex-1 btn-success"
              >
                {isProcessing ? "..." : "තහවුරු කරන්න"}
                <span className="si-label">Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
