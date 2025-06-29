"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiAlertTriangle, FiFilter, FiShoppingCart, FiArrowUp, FiArrowDown, 
  FiHome, FiArrowLeft, FiX, FiPackage, FiRefreshCw
} from "react-icons/fi";

interface Product {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
  image?: string;
  description?: string;
}

export default function LowStockPage() {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [threshold, setThreshold] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>("quantity");
  const [sortDirection, setSortDirection] = useState<string>("asc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState<boolean>(true);
  
  // Extract unique categories
  const categories = ["all", ...Array.from(new Set(products
    .filter(p => p.quantity < threshold)
    .map(p => p.category || "uncategorized")))];

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when threshold changes
  useEffect(() => {
    filterAndSortProducts();
  }, [products, threshold, sortBy, sortDirection, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    // First filter by threshold
    let filtered = products.filter(product => product.quantity < threshold);
    
    // Then filter by category if not "all"
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        product => (product.category || "uncategorized") === categoryFilter
      );
    }
    
    // Then sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "quantity") {
        comparison = a.quantity - b.quantity;
      } else if (sortBy === "category") {
        comparison = (a.category || "").localeCompare(b.category || "");
      } else if (sortBy === "price") {
        comparison = a.price - b.price;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    setFilteredProducts(filtered);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // Get the class for stock indicator based on quantity
  const getStockStatusClass = (quantity: number) => {
    if (quantity === 0) return "bg-red-100 text-red-800"; // Out of stock
    if (quantity <= 2) return "bg-orange-100 text-orange-800"; // Very low
    return "bg-yellow-100 text-yellow-800"; // Low
  };

  // Get the text for stock indicator based on quantity
  const getStockStatusText = (quantity: number) => {
    if (quantity === 0) return "Out of Stock";
    if (quantity <= 2) return "Critical";
    return "Low";
  };

  // Reset filters to default
  const resetFilters = () => {
    setThreshold(5);
    setCategoryFilter("all");
    setSortBy("quantity");
    setSortDirection("asc");
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
                <Link href="/products" className="hover:text-white transition-colors">
                  <span className="flex items-center">Products</span>
                </Link>
                <span>/</span>
                <span className="text-white">Low Stock</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <FiAlertTriangle className="h-6 w-6 text-yellow-400" /> Low Stock Alerts
              </h1>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
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
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
          
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center text-gray-700 font-medium">
                <FiFilter className="mr-2" /> Filter & Sort Options
              </span>
              <span className="text-gray-400">
                {showFilters ? <FiArrowUp /> : <FiArrowDown />}
              </span>
            </button>
          </div>
          
          {showFilters && (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Threshold
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value) || 5)}
                      min="1"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm"
                      placeholder="Set threshold value"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500">units</span>
                    </div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["quantity", "name", "category", "price"].map(field => (
                      <button
                        key={field}
                        onClick={() => toggleSort(field)}
                        className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 border-2 transition-colors
                          ${sortBy === field 
                            ? "bg-black text-white border-black" 
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                        {sortBy === field && (
                          sortDirection === "asc" ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end items-center mt-6 pt-4 border-t border-gray-200 gap-3">
                <button
                  onClick={resetFilters}
                  className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
                >
                  <FiX className="mr-2" /> Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPackage className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No low stock products found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                All products are above the threshold of {threshold} units. You can lower the threshold to see more products.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center"
              >
                <FiX className="mr-2" /> Reset Filters
              </button>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-product.png'; 
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                <FiPackage size={20} />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-800">{product.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description?.substring(0, 50) || "No description"}
                                {product.description && product.description.length > 50 ? "..." : ""}
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
                          ₹{product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          <span className={`${product.quantity === 0 ? "text-red-600" : product.quantity <= 2 ? "text-orange-600" : "text-yellow-600"}`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStockStatusClass(product.quantity)}`}>
                            {getStockStatusText(product.quantity)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/transactions?product=${product._id}&mode=buy`} 
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FiShoppingCart size={14} /> Buy More
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
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
                        <div className="text-sm text-gray-500 mb-2 truncate">
                          {product.description?.substring(0, 50) || "No description"}
                          {product.description && product.description.length > 50 ? "..." : ""}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {product.category && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                              {product.category}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getStockStatusClass(product.quantity)}`}>
                            {getStockStatusText(product.quantity)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3">
                            <div className="text-sm">
                              <span className="text-gray-500">Price:</span> 
                              <span className="font-medium ml-1">₹{product.price.toFixed(2)}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Qty:</span> 
                              <span className={`font-medium ml-1 ${product.quantity === 0 ? "text-red-600" : product.quantity <= 2 ? "text-orange-600" : "text-yellow-600"}`}>
                                {product.quantity}
                              </span>
                            </div>
                          </div>
                          
                          <Link 
                            href={`/transactions?product=${product._id}&mode=buy`} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FiShoppingCart size={12} /> Buy
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Section */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-1.5 bg-yellow-500"></div>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-100 h-12 w-12 rounded-full flex items-center justify-center">
                    <FiAlertTriangle className="text-yellow-500 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Low Stock Items</p>
                    <p className="text-2xl font-bold text-gray-800">{filteredProducts.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-1.5 bg-orange-500"></div>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 h-12 w-12 rounded-full flex items-center justify-center">
                    <FiAlertTriangle className="text-orange-500 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Critical Items (≤ 2)</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {filteredProducts.filter(p => p.quantity <= 2).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-1.5 bg-red-500"></div>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 h-12 w-12 rounded-full flex items-center justify-center">
                    <FiX className="text-red-500 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Out of Stock</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {filteredProducts.filter(p => p.quantity === 0).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}