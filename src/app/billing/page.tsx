"use client";

import { useEffect, useState, FormEvent } from "react";
import { 
  FiPlus, FiTrash2, FiSearch, FiPrinter, FiDownload, 
  FiSave, FiShoppingBag, FiChevronDown, FiUser, FiCalendar,
  FiClock, FiArrowLeft, FiFilter
} from "react-icons/fi";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface BillItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

interface Bill {
  _id: string;
  customerName: string;
  date: string;
  items: {
    product: string;
    name: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }[];
  total: number;
}

export default function BillingPage() {
  // All your existing state variables
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [billDate, setBillDate] = useState("");
  const [billTotal, setBillTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"create" | "history">("create");
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  // Initialize date and handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    const today = new Date().toISOString().split("T")[0];
    setBillDate(today);
    setReceiptNumber(`RCT-${Date.now().toString().slice(-6)}`);
  }, []);

  // Keep all your existing useEffects and functions
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setMessage({
          text: "Failed to load products",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate total whenever selected items change
  useEffect(() => {
    const total = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    setBillTotal(total);
  }, [selectedItems]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);
  
  // Fetch bills when switching to history view
  useEffect(() => {
    if (viewMode === "history") {
      fetchBills();
    }
  }, [viewMode]);

  // Fetch all bills
  const fetchBills = async () => {
    setIsLoadingBills(true);
    try {
      const res = await fetch("/api/billing");
      if (!res.ok) throw new Error("Failed to fetch bills");
      const data = await res.json();
      setBills(data);
    } catch (error) {
      console.error("Error fetching bills:", error);
      setMessage({
        text: "Failed to load bills",
        type: "error",
      });
    } finally {
      setIsLoadingBills(false);
    }
  };

  // Add item to bill
  const addItemToBill = () => {
    if (!currentProduct) {
      return;
    }

    if (currentQuantity <= 0) {
      setMessage({
        text: "Quantity must be greater than zero",
        type: "error",
      });
      return;
    }

    if (currentQuantity > currentProduct.quantity) {
      setMessage({
        text: `Only ${currentProduct.quantity} units available in stock`,
        type: "error",
      });
      return;
    }

    // Check if product already exists in the bill
    const existingItemIndex = selectedItems.findIndex(
      (item) => item.product._id === currentProduct._id
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...selectedItems];
      const totalQuantity = updatedItems[existingItemIndex].quantity + currentQuantity;
      
      if (totalQuantity > currentProduct.quantity) {
        setMessage({
          text: `Cannot add ${currentQuantity} more units. Only ${
            currentProduct.quantity - updatedItems[existingItemIndex].quantity
          } units available`,
          type: "error",
        });
        return;
      }
      
      updatedItems[existingItemIndex].quantity = totalQuantity;
      updatedItems[existingItemIndex].lineTotal = 
        totalQuantity * currentProduct.price;
      
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      const newItem: BillItem = {
        product: currentProduct,
        quantity: currentQuantity,
        lineTotal: currentProduct.price * currentQuantity,
      };
      
      setSelectedItems([...selectedItems, newItem]);
    }

    // Reset current selection
    setCurrentProduct(null);
    setCurrentQuantity(1);
    setSearchTerm("");
    setShowProductDropdown(false);
    setMessage(null);
  };

  // Remove item from bill
  const removeItem = (index: number) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updatedItems);
  };

  // Update item quantity
  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    
    const product = selectedItems[index].product;
    
    if (quantity > product.quantity) {
      setMessage({
        text: `Only ${product.quantity} units available in stock`,
        type: "error",
      });
      return;
    }
    
    const updatedItems = [...selectedItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].lineTotal = quantity * product.price;
    
    setSelectedItems(updatedItems);
    setMessage(null);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      setMessage({
        text: "Please add at least one product to the bill",
        type: "error",
      });
      return;
    }

    if (!customerName.trim()) {
      setMessage({
        text: "Please enter customer name",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    // Prepare bill data
    const billData: Bill = {
      _id: "",
      customerName,
      date: billDate,
      items: selectedItems.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      total: billTotal,
    };

    try {
      // Save bill to database
      const response = await fetch("/api/billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create bill");
      }

      // Update product stock through sell API
      for (const item of selectedItems) {
        await fetch(`/api/products/${item.product._id}/sell`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: item.quantity }),
        });
      }

      // Show success message
      setMessage({
        text: "Bill created successfully!",
        type: "success",
      });

      // Reset form
      setSelectedItems([]);
      setCustomerName("");
      const today = new Date().toISOString().split("T")[0];
      setBillDate(today);
    } catch (error) {
      console.error("Error creating bill:", error);
      setMessage({
        text: error instanceof Error ? error.message : "Failed to create bill",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download bill
  const downloadBill = (bill: Bill) => {
    // Create a printable/downloadable version of the bill
    const billContent = `
    RECEIPT
    =============================
    
    Customer: ${bill.customerName}
    Date: ${new Date(bill.date).toLocaleDateString()}
    Bill ID: ${bill._id}
    
    ITEMS
    -----------------------------
    ${bill.items.map((item, i) => 
      `${i+1}. ${item.name}
      Price: ₹${item.price} × ${item.quantity} = ₹${item.lineTotal}`
    ).join('\n\n')}
    
    -----------------------------
    TOTAL: ₹${bill.total}
    
    Thank you for your business!
  `;
    
    // Create a Blob containing the bill data
    const blob = new Blob([billContent], { type: 'text/plain' });
    
    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bill-${bill._id}-${bill.customerName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // View bill details
  const viewBillDetails = (bill: Bill) => {
    // Set up the selected items based on the bill
    const itemsFromBill = bill.items.map((item) => ({
      product: {
        _id: item.product,
        name: item.name,
        price: item.price,
        quantity: item.quantity, // This is simplified, may not represent current stock
      },
      quantity: item.quantity,
      lineTotal: item.lineTotal
    }));
    
    setSelectedItems(itemsFromBill);
    setCustomerName(bill.customerName);
    setBillDate(new Date(bill.date).toISOString().split('T')[0]);
    setBillTotal(bill.total);
    setViewMode("create"); // Switch to create view to see details
    
    setMessage({
      text: "Viewing bill details. Make changes and save as new bill if needed.",
      type: "success",
    });
  };

  // Print bill
  const handlePrint = () => {
    window.print();
  };

  // If not yet client-side rendered, show a simple loading state
  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-800 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <div className="bg-gradient-to-r from-gray-800 to-black text-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <FiShoppingBag className="mr-3 h-6 w-6" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Billing System</h1>
                <div className="text-xs sm:text-sm text-gray-300 mt-1">
                  {viewMode === "create" ? "Create new bill" : "View bill history"}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Link 
                href="/"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-600 rounded-md hover:bg-white/10 transition-colors"
              >
                <FiArrowLeft className="mr-1.5" /> Dashboard
              </Link>
              
              <button
                onClick={() => setViewMode("create")}
                className={`inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors ${
                  viewMode === "create"
                    ? "bg-white text-black"
                    : "border border-gray-600 hover:bg-white/10"
                }`}
              >
                <FiPlus className="mr-1.5" /> New Bill
              </button>
              
              <button
                onClick={() => setViewMode("history")}
                className={`inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors ${
                  viewMode === "history"
                    ? "bg-white text-black"
                    : "border border-gray-600 hover:bg-white/10"
                }`}
              >
                <FiClock className="mr-1.5" /> History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 shadow-sm ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 mr-3 h-5 w-5 rounded-full ${
                message.type === "success" ? "bg-green-100" : "bg-red-100"
              } flex items-center justify-center`}>
                {message.type === "success" ? (
                  <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm sm:text-base">{message.text}</span>
            </div>
          </div>
        )}

        {/* Bill History View */}
        {viewMode === "history" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Bill History</h2>
                
                <div className="mt-3 sm:mt-0">
                  <div className="relative inline-block">
                    <button 
                      className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 shadow-sm"
                    >
                      <FiFilter className="mr-2" />
                      <span>Filter</span>
                      <FiChevronDown className="ml-2" />
                    </button>
                  </div>
                </div>
              </div>
              
              {isLoadingBills ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin h-10 w-10 border-4 border-gray-800 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-gray-600">Loading bills...</p>
                </div>
              ) : bills.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                    <FiShoppingBag className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Bills Found</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    You haven't created any bills yet. Create your first bill to get started.
                  </p>
                  <button
                    onClick={() => setViewMode("create")}
                    className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <FiPlus className="mr-2" /> Create New Bill
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:-mx-6 border-t border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bills.map((bill) => (
                        <tr key={bill._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <FiCalendar className="text-gray-400 mr-2" />
                              <span>{new Date(bill.date).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <FiUser className="text-gray-400 mr-2" />
                              <span className="font-medium">{bill.customerName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                              {bill.items.length} items
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{bill.total.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => viewBillDetails(bill)}
                                className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                              >
                                <FiSearch className="mr-1" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => downloadBill(bill)}
                                className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <FiDownload className="mr-1" />
                                <span className="hidden sm:inline">Download</span>
                              </button>
                              <button
                                onClick={handlePrint}
                                className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                              >
                                <FiPrinter className="mr-1" />
                                <span className="hidden sm:inline">Print</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bill Creation View */}
        {viewMode === "create" && (
          <div className="space-y-6">
            {/* Customer and Product Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information Card */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="p-4 sm:p-6">
                  <h2 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                    <FiUser className="mr-2 text-gray-500" /> Customer Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name*
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm sm:text-base"
                        placeholder="Enter customer name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="billDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Bill Date
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <FiCalendar className="text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="billDate"
                          value={billDate}
                          onChange={(e) => setBillDate(e.target.value)}
                          className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Receipt #:</span>
                          <span className="font-medium text-gray-700">{receiptNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Items:</span>
                          <span className="font-medium text-gray-700">{selectedItems.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bill Total:</span>
                          <span className="font-medium text-gray-700">₹{billTotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Selection Card */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="p-4 sm:p-6">
                  <h2 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                    <FiShoppingBag className="mr-2 text-gray-500" /> Add Products
                  </h2>
                  <div className="space-y-4">
                    <div className="relative">
                      <label htmlFor="productSearch" className="block text-sm font-medium text-gray-700 mb-1">
                        Search Products
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <FiSearch className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="productSearch"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          placeholder="Search for products..."
                          className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm sm:text-base"
                        />
                      </div>

                      {/* Product dropdown with enhanced styling */}
                      {showProductDropdown && searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto border border-gray-200">
                          {isLoading ? (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                              <p className="mt-1 text-sm text-gray-500">Loading products...</p>
                            </div>
                          ) : filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                              <div
                                key={product._id}
                                className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                onClick={() => {
                                  setCurrentProduct(product);
                                  setSearchTerm(product.name);
                                  setShowProductDropdown(false);
                                }}
                              >
                                <div className="flex items-center space-x-3">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-500 flex-shrink-0">
                                      <FiShoppingBag size={16} />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {product.name}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-xs font-medium text-gray-900">₹{product.price}</span>
                                      <span className={`text-xs ${product.quantity > 0 ? 'text-green-700' : 'text-red-600'}`}>
                                        {product.quantity > 0
                                          ? `${product.quantity} in stock`
                                          : "Out of stock"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center">
                              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                                <FiSearch className="h-6 w-6 text-gray-400" />
                              </div>
                              <p className="mt-2 text-sm text-gray-500">No products found</p>
                              <p className="mt-1 text-xs text-gray-400">Try a different search term</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          id="quantity"
                          min="1"
                          value={currentQuantity}
                          onChange={(e) => setCurrentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm sm:text-base"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addItemToBill}
                          disabled={!currentProduct}
                          className={`w-full flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                            !currentProduct
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                          }`}
                        >
                          <FiPlus />
                          Add Item
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Items Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h2 className="flex items-center text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                    <FiShoppingBag className="mr-2 text-gray-500" /> Bill Items
                  </h2>
                  {selectedItems.length > 0 && (
                    <div className="text-sm text-gray-700">
                      Total: <span className="font-semibold text-base">₹{billTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {selectedItems.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                      <FiShoppingBag className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Items Added</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Search for products above and add them to create a bill.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 -mx-4 sm:-mx-6 overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-0">#</th>
                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                {index + 1}
                              </td>
                              <td className="px-4 sm:px-6 py-3 text-sm">
                                <div className="flex items-center">
                                  {item.product.image ? (
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name}
                                      className="h-8 w-8 object-cover rounded-md flex-shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-500 flex-shrink-0">
                                      <FiShoppingBag size={14} />
                                    </div>
                                  )}
                                  <div className="ml-2 overflow-hidden">
                                    <div className="text-sm font-medium text-gray-900 truncate">{item.product.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                ₹{item.product.price.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm">
                                <div className="w-20 sm:w-24">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                    className="w-full p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                ₹{item.lineTotal.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-sm print:hidden">
                                <button
                                  onClick={() => removeItem(index)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td colSpan={4} className="px-4 sm:px-6 py-3 text-right text-sm font-semibold text-gray-900">
                              Total Amount:
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm font-bold text-gray-900">
                              ₹{billTotal.toLocaleString('en-IN')}
                            </td>
                            <td className="print:hidden"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Container */}
            <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedItems.length === 0 || window.confirm("Are you sure you want to clear all items?")) {
                      setSelectedItems([]);
                      setCurrentProduct(null);
                      setCurrentQuantity(1);
                      setSearchTerm("");
                      setMessage(null);
                    }
                  }}
                  disabled={selectedItems.length === 0}
                  className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Clear Items
                </button>
                
                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                  >
                    <FiPrinter className="mr-1.5" />
                    Print Bill
                  </button>
                )}
              </div>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || selectedItems.length === 0 || !customerName.trim()}
                className={`inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting || selectedItems.length === 0 || !customerName.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    Create Bill
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Print-only receipt template */}
      <div className="hidden print:block mt-8 p-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">RECEIPT</h1>
          <p className="text-gray-700 text-xl mt-1">Your Shop Name</p>
          <p className="text-gray-600 mt-2">Address, City, State, ZIP</p>
          <p className="text-gray-600">Phone: (123) 456-7890</p>
        </div>

        <div className="flex justify-between mb-6 text-gray-800">
          <div>
            <p className="mb-1"><span className="font-semibold">Customer:</span> {customerName}</p>
          </div>
          <div className="text-right">
            <p className="mb-1"><span className="font-semibold">Date:</span> {billDate ? new Date(billDate).toLocaleDateString() : ''}</p>
            <p><span className="font-semibold">Receipt #:</span> {receiptNumber}</p>
          </div>
        </div>

        <div className="border-t-2 border-b-2 border-gray-300 py-2 mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2 text-left">#</th>
                <th className="py-2 text-left">Item</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3">{index + 1}</td>
                  <td className="py-3">{item.product.name}</td>
                  <td className="py-3 text-right">₹{item.product.price.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">₹{item.lineTotal.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="pt-4 text-right font-bold">Total:</td>
                <td className="pt-4 text-right font-bold">₹{billTotal.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className="text-center text-gray-600 text-sm mt-8">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}