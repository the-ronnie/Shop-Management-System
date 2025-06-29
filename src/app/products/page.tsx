"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FiSearch, FiEdit, FiAlertTriangle, FiFilter, FiArrowUp, FiArrowDown,
  FiPackage, FiPlus, FiRefreshCw, FiHome, FiShoppingCart, FiTrash2, FiMinus,
  FiChevronDown, FiChevronUp, FiX, FiDownload
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  
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
      result = result.filter(p => 
        (p.category || "uncategorized") === categoryFilter
      );
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
      if (!res.ok) throw new Error("Failed to fetch products");
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
    
    try {
      const res = await fetch(`/api/products/${id}/buy`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to buy product");
      }
      
      fetchProducts();
      alert(`Successfully purchased ${quantity} unit(s)`);
    } catch (error) {
      console.error("Error buying product:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to buy product"}`);
    }
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
    
    try {
      const res = await fetch(`/api/products/${id}/sell`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to sell product");
      }
      
      fetchProducts();
      alert(`Successfully sold ${quantity} unit(s)`);
    } catch (error) {
      console.error("Error selling product:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to sell product"}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to delete product");
        }
        
        fetchProducts();
        setSelected(null);
        alert("Product deleted successfully");
      } catch (error) {
        console.error("Error deleting product:", error);
        alert(`Error: ${error instanceof Error ? error.message : "Failed to delete product"}`);
      }
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

  // Export products to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Price', 'Quantity', 'Value', 'Description'];
    
    const csvData = [
      headers.join(','),
      ...filteredProducts.map(p => [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.category || 'Uncategorized').replace(/"/g, '""')}"`,
        p.price,
        p.quantity,
        p.price * p.quantity,
        `"${(p.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setSortBy("name");
    setSortDirection("asc");
  };

  // Format currency consistently
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
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
                <span className="text-white">Inventory</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <FiPackage className="h-6 w-6" /> Product Inventory
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
                href="/add-product" 
                className="inline-flex items-center px-4 py-2 bg-green-600 text-sm font-medium rounded-md text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
              <Link 
                href="/low-stock" 
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-sm font-medium rounded-md text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
              >
                <FiAlertTriangle className="mr-2 h-4 w-4" />
                Low Stock
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700"></div>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 h-12 w-12 rounded-full flex items-center justify-center">
                  <FiPackage className="text-blue-500 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-2xl font-bold text-gray-800">{products.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-green-500 to-green-700"></div>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 h-12 w-12 rounded-full flex items-center justify-center">
                  <FiShoppingCart className="text-green-500 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-700"></div>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 h-12 w-12 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="text-yellow-500 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Low Stock Items</p>
                  <p className="text-2xl font-bold text-gray-800">
                    <Link href="/low-stock" className="flex items-center gap-1 hover:underline">
                      {lowStockCount} <span className="text-sm text-yellow-500">{lowStockCount > 0 && '→'}</span>
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
          
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center text-gray-700 font-medium">
                <FiFilter className="mr-2" /> Search & Filter Options
              </span>
              <span className="text-gray-400">
                {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              </span>
            </button>
          </div>
          
          {showFilters && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="md:col-span-2">
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
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  {["name", "price", "quantity"].map(field => (
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
              
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-3">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
                  >
                    <FiX className="mr-2" /> Reset Filters
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={exportToCSV}
                  disabled={filteredProducts.length === 0}
                  className={`w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium flex items-center justify-center ${
                    filteredProducts.length === 0 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700 transition-all duration-300'
                  }`}
                >
                  <FiDownload className="mr-2" /> Export to CSV
                </button>
              </div>
            </div>
          )}
        </div>
      
        {/* Products Table/Grid */}
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
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {search || categoryFilter !== "all" 
                  ? "Try adjusting your search or filter criteria to find the products you're looking for." 
                  : "You haven't added any products yet. Add your first product to get started."}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              product.quantity === 0 ? "text-red-600" : 
                              product.quantity <= LOW_STOCK_THRESHOLD ? "text-yellow-600" : ""
                            }`}>
                              {product.quantity}
                            </span>
                            {product.quantity <= LOW_STOCK_THRESHOLD && (
                              <FiAlertTriangle className="text-yellow-500" title="Low stock" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSelectProduct(product)}
                              className="p-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="View details"
                            >
                              <FiEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleSell(product._id)}
                              disabled={product.quantity < 1}
                              className={`p-2 text-sm rounded-lg transition-colors ${
                                product.quantity < 1 
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                  : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                              }`}
                              title="Sell one"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleBuy(product._id)}
                              className="p-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
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
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            product.quantity === 0 ? "bg-red-100 text-red-800" : 
                            product.quantity <= LOW_STOCK_THRESHOLD ? "bg-yellow-100 text-yellow-800" : 
                            "bg-green-100 text-green-800"
                          }`}>
                            {product.quantity} in stock
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-800">
                            {formatCurrency(product.price)}
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSell(product._id)}
                              disabled={product.quantity < 1}
                              className={`p-2 text-sm rounded-lg transition-colors ${
                                product.quantity < 1 
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                  : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                              }`}
                              title="Sell one"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleBuy(product._id)}
                              className="p-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              title="Buy one"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleSelectProduct(product)}
                              className="p-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="View details"
                            >
                              <FiEdit size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-black to-gray-700 rounded-t-xl"></div>
            
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
              aria-label="Close"
            >
              <FiX size={20} />
            </button>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  {selected.image ? (
                    <img
                      src={selected.image}
                      alt={selected.name}
                      className="w-full h-auto object-contain rounded-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.png';
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-5xl">
                      <FiPackage size={64} />
                    </div>
                  )}
                </div>
                
                <div className="md:w-2/3">
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">{selected.name}</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 text-sm">Category</p>
                      <p className="font-medium text-gray-800">{selected.category || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Price</p>
                      <p className="font-medium text-gray-800">{formatCurrency(selected.price)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Current Stock</p>
                      <p className={`font-medium ${selected.quantity <= LOW_STOCK_THRESHOLD ? "text-yellow-600" : "text-gray-800"}`}>
                        {selected.quantity} {selected.quantity <= LOW_STOCK_THRESHOLD && "(Low)"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Stock Value</p>
                      <p className="font-medium text-gray-800">{formatCurrency(selected.price * selected.quantity)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-500 text-sm mb-1">Description</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {selected.description || "No description available"}
                    </p>
                  </div>
                  
                  {/* Custom quantity input */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <h3 className="font-medium text-gray-800 w-full mb-2">Adjust Inventory</h3>
                      <div className="flex items-center gap-3">
                        <label className="text-gray-600">Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          value={customQuantity}
                          onChange={(e) => setCustomQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                          className="border-2 border-gray-200 rounded-lg px-3 py-1 w-20 text-center focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBuy(selected._id, customQuantity)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <FiPlus size={16} /> Buy
                        </button>
                        <button
                          onClick={() => handleSell(selected._id, customQuantity)}
                          disabled={selected.quantity < customQuantity}
                          className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
                            selected.quantity < customQuantity
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                          }`}
                        >
                          <FiMinus size={16} /> Sell
                        </button>
                      </div>
                      
                      {/* Quick action buttons */}
                      <div className="w-full pt-2 mt-2 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Quick actions:</div>
                        <div className="flex flex-wrap gap-2">
                          {[1, 5, 10, 20].map(qty => (
                            <button
                              key={qty}
                              onClick={() => setCustomQuantity(qty)}
                              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                            >
                              {qty} units
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleDelete(selected._id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <FiTrash2 size={16} /> Delete Product
                      </button>
                      <Link 
                        href={`/edit-product/${selected._id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FiEdit size={16} /> Edit Details
                      </Link>
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