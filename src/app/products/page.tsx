"use client";

import { useEffect, useState } from "react";
import { FiSearch, FiEdit, FiAlertTriangle, FiFilter, FiArrowUp, FiArrowDown } from "react-icons/fi";

interface Product {
  _id: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  description?: string;
  category?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(true);
  
  // For custom quantity operations
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  
  // For analytics
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  
  // Extract unique categories
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category || "uncategorized")))];
  
  // Low stock threshold
  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    fetchProducts();
  }, []);
  
  useEffect(() => {
    // Apply filters and sorting
    let result = [...products];
    
    // Filter by search term
    if (search) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by category
    if (categoryFilter !== "all") {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "price") {
        comparison = a.price - b.price;
      } else if (sortBy === "quantity") {
        comparison = a.quantity - b.quantity;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    setFilteredProducts(result);
    
    // Calculate analytics
    setTotalValue(products.reduce((sum, p) => sum + (p.price * p.quantity), 0));
    setLowStockCount(products.filter(p => p.quantity <= LOW_STOCK_THRESHOLD).length);
  }, [products, search, categoryFilter, sortBy, sortDirection]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (id: string, quantity: number = 1) => {
    if (quantity <= 0) {
      alert("Please enter a valid quantity greater than zero");
      return;
    }
    
    await fetch(`/api/products/${id}/buy`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity })
    });
    fetchProducts();
  };

  const handleSell = async (id: string, quantity: number = 1) => {
    if (quantity <= 0) {
      alert("Please enter a valid quantity greater than zero");
      return;
    }
    
    const product = products.find(p => p._id === id);
    if (product && quantity > product.quantity) {
      alert("Cannot sell more than available stock");
      return;
    }
    
    await fetch(`/api/products/${id}/sell`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity })
    });
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      fetchProducts();
      setSelected(null);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // Reset custom quantity when selecting a product
  const handleSelectProduct = (product: Product) => {
    setSelected(product);
    setCustomQuantity(1);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">📦 Inventory Management</h2>
      
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <h3 className="font-semibold text-blue-800">Total Products</h3>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <h3 className="font-semibold text-green-800">Total Inventory Value</h3>
          <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <h3 className="font-semibold text-yellow-800">Low Stock Items</h3>
          <p className="text-2xl font-bold">{lowStockCount}</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded bg-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
            <button 
              onClick={() => fetchProducts()}
              className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <FiFilter /> Filter
            </button>
          </div>
        </div>
        
        {/* Sorting Options */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-600 flex items-center">Sort by:</span>
          {["name", "price", "quantity"].map(field => (
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
      
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
          <p>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No products found matching your criteria</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Products Table */}
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Product</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Category</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Price</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Stock</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Actions</th>
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
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.quantity}</span>
                      {product.quantity <= LOW_STOCK_THRESHOLD && (
                        <FiAlertTriangle className="text-yellow-500" title="Low stock" />
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectProduct(product)}
                        className="p-2 text-sm bg-blue-50 text-blue-600 rounded"
                        title="View details"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleSell(product._id)}
                        disabled={product.quantity < 1}
                        className={`p-2 text-sm rounded ${
                          product.quantity < 1 
                            ? "bg-gray-100 text-gray-400" 
                            : "bg-yellow-50 text-yellow-600"
                        }`}
                        title="Sell one"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleBuy(product._id)}
                        className="p-2 text-sm bg-green-50 text-green-600 rounded"
                        title="Buy one"
                      >
                        +1
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-2xl relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-3 text-xl font-bold"
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                {selected.image ? (
                  <img
                    src={selected.image}
                    alt={selected.name}
                    className="w-full h-auto object-contain rounded"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400 text-5xl">
                    📦
                  </div>
                )}
              </div>
              
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold mb-2">{selected.name}</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-sm">Category</p>
                    <p>{selected.category || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Price</p>
                    <p className="font-semibold">₹{selected.price}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Current Stock</p>
                    <p className={`font-semibold ${selected.quantity <= LOW_STOCK_THRESHOLD ? "text-yellow-600" : ""}`}>
                      {selected.quantity} {selected.quantity <= LOW_STOCK_THRESHOLD && "(Low)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Stock Value</p>
                    <p className="font-semibold">₹{(selected.price * selected.quantity).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Description</p>
                  <p className="text-gray-800">{selected.description || "No description available"}</p>
                </div>
                
                <div className="space-y-4">
                  {/* Custom quantity input */}
                  <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 w-full">Adjust Inventory</h3>
                    <div className="flex items-center gap-3">
                      <label className="text-gray-600">Quantity:</label>
                      <input
                        type="number"
                        min="1"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                        className="border rounded px-3 py-1 w-20 text-center"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBuy(selected._id, customQuantity)}
                        className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1"
                      >
                        <span>➕</span> Buy
                      </button>
                      <button
                        onClick={() => handleSell(selected._id, customQuantity)}
                        disabled={selected.quantity < customQuantity}
                        className={`px-4 py-2 rounded flex items-center gap-1 ${
                          selected.quantity < customQuantity
                            ? "bg-gray-300 text-gray-500"
                            : "bg-yellow-500 text-white"
                        }`}
                      >
                        <span>➖</span> Sell
                      </button>
                    </div>
                    
                    {/* Quick action buttons */}
                    <div className="w-full pt-2 mt-2 border-t">
                      <div className="text-sm text-gray-600 mb-1">Quick actions:</div>
                      <div className="flex flex-wrap gap-2">
                        {[1, 5, 10, 20].map(qty => (
                          <button
                            key={qty}
                            onClick={() => setCustomQuantity(qty)}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                          >
                            {qty} units
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleDelete(selected._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      🗑️ Delete Product
                    </button>
                    <div className="text-xs text-gray-500">
                      In stock: {selected.quantity} units
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}