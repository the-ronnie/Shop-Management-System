"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiFilter, FiShoppingCart, FiArrowUp, FiArrowDown } from "react-icons/fi";

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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FiAlertTriangle className="text-yellow-500" /> Low Stock Alerts
      </h1>

      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Threshold
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value) || 5)}
              min="1"
              className="w-full md:w-32 p-2 border rounded"
            />
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            {["quantity", "name", "category", "price"].map(field => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`px-3 py-1 text-sm rounded-full flex items-center gap-1
                  ${sortBy === field ? "bg-blue-100 text-blue-800" : "bg-gray-100"}`}
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

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
          <p>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiAlertTriangle className="text-gray-400 text-4xl mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-500">No low stock products found</p>
          <p className="text-gray-400">All products are above the threshold of {threshold} units</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Product</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Category</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Price</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Quantity</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.png'; 
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                            📦
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description?.substring(0, 50) || "No description"}
                            {product.description && product.description.length > 50 ? "..." : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {product.category ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-3 font-medium">₹{product.price}</td>
                    <td className="p-3 font-medium">
                      <span className={`${product.quantity === 0 ? "text-red-600" : product.quantity <= 2 ? "text-orange-600" : "text-yellow-600"}`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStockStatusClass(product.quantity)}`}>
                        {getStockStatusText(product.quantity)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link href={`/transactions?product=${product._id}&mode=buy`} className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                        <FiShoppingCart size={14} /> Buy More
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Section */}
      {!loading && filteredProducts.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-3">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">Total Low Stock Items</p>
              <p className="text-2xl font-bold">{filteredProducts.length}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-800">Critical Items (≤ 2)</p>
              <p className="text-2xl font-bold">
                {filteredProducts.filter(p => p.quantity <= 2).length}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800">Out of Stock</p>
              <p className="text-2xl font-bold">
                {filteredProducts.filter(p => p.quantity === 0).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}