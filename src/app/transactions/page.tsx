"use client";

import { useEffect, useState } from "react";
import { FiShoppingBag, FiShoppingCart, FiAlertTriangle, FiLoader } from "react-icons/fi";

interface Product {
  _id: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  description?: string;
  category?: string;
}

interface TransactionItem {
  productId: string;
  quantity: number;
  isSelected: boolean;
}

export default function TransactionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactionItems, setTransactionItems] = useState<Record<string, TransactionItem>>({});
  const [transactionMode, setTransactionMode] = useState<"buy" | "sell">("buy");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Low stock threshold
  const LOW_STOCK_THRESHOLD = 5;

  // Fetch products data
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      
      const data = await response.json();
      setProducts(data);
      
      // Initialize transaction items
      const items: Record<string, TransactionItem> = {};
      data.forEach((product: Product) => {
        items[product._id] = {
          productId: product._id,
          quantity: 1,
          isSelected: false,
        };
      });
      setTransactionItems(items);
    } catch (error) {
      console.error("Error fetching products:", error);
      setMessage({ text: "Failed to load products", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle transaction mode
  const toggleTransactionMode = (mode: "buy" | "sell") => {
    setTransactionMode(mode);
  };

  // Toggle item selection
  const toggleItemSelection = (productId: string) => {
    setTransactionItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        isSelected: !prev[productId].isSelected,
      }
    }));
  };

  // Update quantity for a transaction item
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) quantity = 1;
    
    setTransactionItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: quantity,
      }
    }));
  };

  // Check if transaction is valid
  const validateTransaction = () => {
    const selectedItems = Object.values(transactionItems).filter(item => item.isSelected);
    
    if (selectedItems.length === 0) {
      setMessage({ text: "Please select at least one product", type: "error" });
      return false;
    }

    if (transactionMode === "sell") {
      // Check if any selected product has insufficient stock
      const invalidItem = selectedItems.find(item => {
        const product = products.find(p => p._id === item.productId);
        return product && product.quantity < item.quantity;
      });

      if (invalidItem) {
        const product = products.find(p => p._id === invalidItem.productId);
        setMessage({ 
          text: `Cannot sell ${invalidItem.quantity} units of ${product?.name}. Only ${product?.quantity} in stock.`, 
          type: "error" 
        });
        return false;
      }
    }

    return true;
  };

  // Submit transaction
  const submitTransaction = async () => {
    if (!validateTransaction()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const selectedItems = Object.values(transactionItems).filter(item => item.isSelected);
      const results = [];

      // Process each selected item sequentially
      for (const item of selectedItems) {
        const endpoint = transactionMode === "buy" 
          ? `/api/products/${item.productId}/buy` 
          : `/api/products/${item.productId}/sell`;
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: item.quantity }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to ${transactionMode} product`);
        }

        results.push(await response.json());
      }

      // Display success message
      setMessage({ 
        text: `Successfully ${transactionMode === "buy" ? "purchased" : "sold"} ${selectedItems.length} product(s)`, 
        type: "success" 
      });

      // Refresh products to show updated quantities
      fetchProducts();
    } catch (error) {
      console.error(`Error processing ${transactionMode} transaction:`, error);
      setMessage({ 
        text: error instanceof Error ? error.message : `Failed to process ${transactionMode} transaction`, 
        type: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const selectedItems = Object.values(transactionItems).filter(item => item.isSelected);
    let totalItems = 0;
    let totalValue = 0;

    selectedItems.forEach(item => {
      const product = products.find(p => p._id === item.productId);
      if (product) {
        totalItems += item.quantity;
        totalValue += product.price * item.quantity;
      }
    });

    return { totalItems, totalValue };
  };

  const { totalItems, totalValue } = calculateTotals();

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Bulk Transactions</h1>

      {/* Transaction Mode Toggle */}
      <div className="flex bg-gray-100 p-2 rounded-lg mb-6 w-fit">
        <button
          onClick={() => toggleTransactionMode("buy")}
          className={`px-4 py-2 rounded-md flex items-center gap-2 ${
            transactionMode === "buy" 
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          <FiShoppingCart /> Buy (Stock In)
        </button>
        <button
          onClick={() => toggleTransactionMode("sell")}
          className={`px-4 py-2 rounded-md ml-2 flex items-center gap-2 ${
            transactionMode === "sell"
              ? "bg-yellow-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          <FiShoppingBag /> Sell (Stock Out)
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-3 mb-4 rounded-md ${
          message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Products Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <FiLoader className="animate-spin mr-2" />
          <span>Loading products...</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left">Select</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Current Stock</th>
                  <th className="p-3 text-left">{transactionMode === "buy" ? "Buy" : "Sell"} Quantity</th>
                  <th className="p-3 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const transactionItem = transactionItems[product._id];
                  const isLowStock = product.quantity <= LOW_STOCK_THRESHOLD;
                  const transactionValue = product.price * (transactionItem?.quantity || 0);

                  return (
                    <tr key={product._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={transactionItem?.isSelected || false}
                          onChange={() => toggleItemSelection(product._id)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-8 w-8 mr-3 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 mr-3 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">📦</div>
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {product.category ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-3">₹{product.price}</td>
                      <td className={`p-3 ${isLowStock ? "text-yellow-600" : ""}`}>
                        <div className="flex items-center">
                          <span>{product.quantity}</span>
                          {isLowStock && <FiAlertTriangle className="ml-1 text-yellow-500" title="Low stock" />}
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="1"
                          value={transactionItem?.quantity || 1}
                          onChange={(e) => updateQuantity(product._id, parseInt(e.target.value) || 1)}
                          className={`w-16 p-1 border rounded ${
                            transactionMode === "sell" && (transactionItem?.quantity || 0) > product.quantity
                              ? "border-red-500"
                              : ""
                          }`}
                          disabled={!transactionItem?.isSelected}
                        />
                        {transactionMode === "sell" && (transactionItem?.quantity || 0) > product.quantity && (
                          <div className="text-xs text-red-500 mt-1">Not enough stock</div>
                        )}
                      </td>
                      <td className="p-3 font-medium">
                        {transactionItem?.isSelected ? `₹${transactionValue}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Transaction Summary */}
          <div className="bg-gray-50 p-4 rounded-lg shadow mb-6">
            <h3 className="font-medium text-lg mb-2">Transaction Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded border">
                <div className="text-gray-500 text-sm">Transaction Type</div>
                <div className="font-medium">
                  {transactionMode === "buy" ? "Purchase (Stock In)" : "Sale (Stock Out)"}
                </div>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="text-gray-500 text-sm">Total Items</div>
                <div className="font-medium">{totalItems} units</div>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="text-gray-500 text-sm">Total Value</div>
                <div className="font-medium">₹{totalValue.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={submitTransaction}
              disabled={isSubmitting || totalItems === 0}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : transactionMode === "buy"
                    ? "bg-green-600 text-white"
                    : "bg-yellow-600 text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {transactionMode === "buy" ? <FiShoppingCart /> : <FiShoppingBag />}
                  Submit {transactionMode === "buy" ? "Purchase" : "Sale"}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}