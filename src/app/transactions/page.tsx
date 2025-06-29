"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FiShoppingBag, FiShoppingCart, FiAlertTriangle, FiLoader,
  FiHome, FiSearch, FiRefreshCw, FiX, FiFilter, FiChevronUp,  FiPlus, FiMinus,
  FiChevronDown, FiPackage, FiCheck, FiDollarSign
} from "react-icons/fi";

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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [transactionItems, setTransactionItems] = useState<Record<string, TransactionItem>>({});
  const [transactionMode, setTransactionMode] = useState<"buy" | "sell">("buy");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(true);

  // Low stock threshold
  const LOW_STOCK_THRESHOLD = 5;

  // Extract unique categories
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category || "uncategorized")))];

  // Fetch products data
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when search or category changes
  useEffect(() => {
    if (products.length) {
      let filtered = [...products];
      
      // Apply search filter
      if (search) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search.toLowerCase()) || 
          p.description?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Apply category filter
      if (categoryFilter !== "all") {
        filtered = filtered.filter(p => 
          (p.category || "uncategorized") === categoryFilter
        );
      }
      
      setFilteredProducts(filtered);
    }
  }, [products, search, categoryFilter]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      
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
    
    // Reset selected items when changing mode
    setTransactionItems(prev => {
      const updated = {...prev};
      Object.keys(updated).forEach(key => {
        updated[key] = {...updated[key], isSelected: false};
      });
      return updated;
    });
    
    // Clear any error messages
    setMessage(null);
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

  // Select all items
  const selectAllItems = () => {
    setTransactionItems(prev => {
      const updated = {...prev};
      filteredProducts.forEach(product => {
        updated[product._id] = {
          ...updated[product._id],
          isSelected: true,
        };
      });
      return updated;
    });
  };

  // Deselect all items
  const deselectAllItems = () => {
    setTransactionItems(prev => {
      const updated = {...prev};
      Object.keys(updated).forEach(key => {
        updated[key] = {...updated[key], isSelected: false};
      });
      return updated;
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    const selectedItems = Object.values(transactionItems).filter(item => item.isSelected);
    let totalItems = 0;
    let totalValue = 0;
    let totalProducts = 0;

    selectedItems.forEach(item => {
      const product = products.find(p => p._id === item.productId);
      if (product) {
        totalItems += item.quantity;
        totalValue += product.price * item.quantity;
        totalProducts++;
      }
    });

    return { totalItems, totalValue, totalProducts };
  };

  const { totalItems, totalValue, totalProducts } = calculateTotals();

  // Format currency consistently
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setShowFilters(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive Header with gradient and breadcrumbs */}
      <div className="bg-gradient-to-r from-black to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                <Link href="/" className="hover:text-white transition-colors">
                  <span className="flex items-center"><FiHome className="mr-1" /> Home</span>
                </Link>
                <span>/</span>
                <span className="text-white">Bulk Transactions</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                {transactionMode === "buy" ? (
                  <><FiShoppingCart className="h-6 w-6" /> Bulk Purchase</>
                ) : (
                  <><FiShoppingBag className="h-6 w-6" /> Bulk Sale</>
                )}
              </h1>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
              <button 
                onClick={fetchProducts}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <FiRefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </button>
              <Link 
                href="/products" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <FiPackage className="mr-2 h-4 w-4" />
                View All Products
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Transaction Mode Toggle */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
          
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Select Transaction Type</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => toggleTransactionMode("buy")}
                className={`px-6 py-4 rounded-lg flex-1 flex items-center justify-center gap-3 transition-all ${
                  transactionMode === "buy" 
                    ? "bg-green-600 text-white shadow-lg ring-2 ring-green-600 ring-offset-2"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <FiShoppingCart className={`h-5 w-5 ${transactionMode === "buy" ? "text-white" : "text-gray-500"}`} />
                <div className="text-left">
                  <div className="font-medium">Buy Products</div>
                  <div className="text-sm opacity-80">Add inventory to stock</div>
                </div>
              </button>
              
              <button
                onClick={() => toggleTransactionMode("sell")}
                className={`px-6 py-4 rounded-lg flex-1 flex items-center justify-center gap-3 transition-all ${
                  transactionMode === "sell"
                    ? "bg-yellow-600 text-white shadow-lg ring-2 ring-yellow-600 ring-offset-2"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <FiShoppingBag className={`h-5 w-5 ${transactionMode === "sell" ? "text-white" : "text-gray-500"}`} />
                <div className="text-left">
                  <div className="font-medium">Sell Products</div>
                  <div className="text-sm opacity-80">Remove from inventory</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-xl mb-6 border ${
            message.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"
          }`}>
            <div className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 mr-3 ${message.type === "success" ? "text-green-500" : "text-red-500"}`}>
                {message.type === "success" ? <FiCheck /> : <FiAlertTriangle />}
              </div>
              <div className="flex-1">
                <p className="font-medium">{message.text}</p>
              </div>
              <button 
                onClick={() => setMessage(null)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
          
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center text-gray-700 font-medium">
                <FiFilter className="mr-2" /> Filter Products
              </span>
              <span className="text-gray-400">
                {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              </span>
            </button>
          </div>
          
          {showFilters && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Products
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <FiSearch className="text-gray-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by name or description..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 sm:px-4 sm:py-3 sm:pl-10 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-3">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full sm:w-auto px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
                  >
                    <FiX className="mr-2" /> Reset Filters
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={selectAllItems}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
                  >
                    <FiCheck className="mr-2" /> Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllItems}
                    disabled={totalProducts === 0}
                    className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
                      totalProducts === 0 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-700 text-white hover:bg-gray-800 transition-all duration-300'
                    }`}
                  >
                    <FiX className="mr-2" /> Deselect All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
            <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading products...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
            <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
            <div className="py-16 px-4 text-center">
              <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPackage className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {search || categoryFilter !== "all" 
                  ? "Try adjusting your search or filter criteria to find the products you're looking for." 
                  : "You haven't added any products yet. Add products first to create transactions."}
              </p>
              {search || categoryFilter !== "all" ? (
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center"
                >
                  <FiX className="mr-2" /> Clear Filters
                </button>
              ) : (
                <Link 
                  href="/add-product" 
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
                >
                  <FiPlus className="mr-2" /> Add First Product
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
            <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {transactionMode === "buy" ? "Buy" : "Sell"} Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map(product => {
                    const transactionItem = transactionItems[product._id];
                    const isLowStock = product.quantity <= LOW_STOCK_THRESHOLD;
                    const transactionValue = product.price * (transactionItem?.quantity || 0);
                    const isInvalidSell = transactionMode === "sell" && (transactionItem?.quantity || 0) > product.quantity;

                    return (
                      <tr key={product._id} className={`${transactionItem?.isSelected ? "bg-blue-50" : ""} hover:bg-gray-50 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={transactionItem?.isSelected || false}
                              onChange={() => toggleItemSelection(product._id)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-product.png'; 
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                <FiPackage size={18} />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-800">{product.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {product.description?.substring(0, 40) || "No description"}
                                {product.description && product.description.length > 40 ? "..." : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.category ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {product.category}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className={`font-medium ${
                              product.quantity === 0 ? "text-red-600" : 
                              isLowStock ? "text-yellow-600" : ""
                            }`}>
                              {product.quantity}
                            </span>
                            {isLowStock && <FiAlertTriangle className="text-yellow-500" title="Low stock" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <input
                              type="number"
                              min="1"
                              value={transactionItem?.quantity || 1}
                              onChange={(e) => updateQuantity(product._id, parseInt(e.target.value) || 1)}
                              className={`w-20 px-3 py-2 border-2 rounded-lg transition-colors focus:outline-none ${
                                isInvalidSell
                                  ? "border-red-300 focus:border-red-500 bg-red-50"
                                  : "border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10"
                              }`}
                              disabled={!transactionItem?.isSelected}
                            />
                            {isInvalidSell && (
                              <div className="text-xs text-red-500 mt-1">Not enough stock</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {transactionItem?.isSelected ? formatCurrency(transactionValue) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredProducts.map(product => {
                const transactionItem = transactionItems[product._id];
                const isLowStock = product.quantity <= LOW_STOCK_THRESHOLD;
                const transactionValue = product.price * (transactionItem?.quantity || 0);
                const isInvalidSell = transactionMode === "sell" && (transactionItem?.quantity || 0) > product.quantity;

                return (
                  <div 
                    key={product._id} 
                    className={`p-4 ${transactionItem?.isSelected ? "bg-blue-50" : ""} hover:bg-gray-50 transition-colors`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex items-center h-full pt-1">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={transactionItem?.isSelected || false}
                          onChange={() => toggleItemSelection(product._id)}
                        />
                      </div>
                      
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.png'; 
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                          <FiPackage size={24} />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{product.name}</h3>
                        
                        <div className="flex flex-wrap items-center gap-2 my-1">
                          {product.category && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                              {product.category}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${
                            product.quantity === 0 ? "bg-red-100 text-red-800" : 
                            isLowStock ? "bg-yellow-100 text-yellow-800" : 
                            "bg-green-100 text-green-800"
                          }`}>
                            {isLowStock && <FiAlertTriangle size={10} />}
                            {product.quantity} in stock
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium text-gray-800">
                            {formatCurrency(product.price)}
                          </div>
                        </div>
                        
                        <div className={`p-3 rounded-lg ${transactionItem?.isSelected ? "bg-white" : "bg-gray-100"}`}>
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-700 font-medium">{transactionMode === "buy" ? "Buy" : "Sell"} Quantity:</label>
                            <div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={transactionItem?.quantity || 1}
                                  onChange={(e) => updateQuantity(product._id, parseInt(e.target.value) || 1)}
                                  className={`w-16 px-2 py-1 border-2 rounded-lg text-center transition-colors focus:outline-none ${
                                    isInvalidSell
                                      ? "border-red-300 focus:border-red-500 bg-red-50"
                                      : "border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10"
                                  }`}
                                  disabled={!transactionItem?.isSelected}
                                />
                                {transactionItem?.isSelected && (
                                  <div className="text-sm font-medium">
                                    = {formatCurrency(transactionValue)}
                                  </div>
                                )}
                              </div>
                              {isInvalidSell && (
                                <div className="text-xs text-red-500 mt-1">Not enough stock</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transaction Summary */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
            <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
            <div className="p-6">
              <h3 className="font-medium text-lg mb-4">Transaction Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    {transactionMode === "buy" ? (
                      <div className="bg-green-100 h-10 w-10 rounded-full flex items-center justify-center">
                        <FiShoppingCart className="text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-yellow-100 h-10 w-10 rounded-full flex items-center justify-center">
                        <FiShoppingBag className="text-yellow-600" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500">Transaction Type</div>
                      <div className="font-medium text-gray-800">
                        {transactionMode === "buy" ? "Purchase (Stock In)" : "Sale (Stock Out)"}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 h-10 w-10 rounded-full flex items-center justify-center">
                      <FiPackage className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Items Selected</div>
                      <div className="font-medium text-gray-800">
                        {totalProducts} products ({totalItems} units)
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 h-10 w-10 rounded-full flex items-center justify-center">
                      <FiDollarSign className="text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Value</div>
                      <div className="font-medium text-gray-800">{formatCurrency(totalValue)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={submitTransaction}
                  disabled={isSubmitting || totalItems === 0}
                  className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                    isSubmitting || totalItems === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : transactionMode === "buy"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-yellow-600 text-white hover:bg-yellow-700"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}