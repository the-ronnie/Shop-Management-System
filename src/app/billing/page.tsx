"use client";

import { useEffect, useState, FormEvent } from "react";
import { FiPlus, FiTrash2, FiSearch, FiPrinter, FiDownload, FiSave } from "react-icons/fi";

interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number; // available stock
  image?: string;  // Add image property to Product interface
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
    product: string; // product ID
    name: string;    // product name
    price: number;
    quantity: number;
    lineTotal: number;
  }[];
  total: number;
}

export default function BillingPage() {
  // States
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
  
  // Bill history states
  const [viewMode, setViewMode] = useState<"create" | "history">("create");
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);

  // Current selection for adding new item
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);

  // Initialize date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setBillDate(today);
  }, []);

  // Fetch products
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

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      {/* View Mode Toggle */}
      <div className="flex mb-6 gap-4">
        <button
          onClick={() => setViewMode("create")}
          className={`px-4 py-2 rounded ${
            viewMode === "create"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Create New Bill
        </button>
        <button
          onClick={() => setViewMode("history")}
          className={`px-4 py-2 rounded ${
            viewMode === "history"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          View Bill History
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`p-4 mb-4 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Bill History View */}
      {viewMode === "history" && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-medium mb-4">Bill History</h2>
          
          {isLoadingBills ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-2 text-gray-600">Loading bills...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bills found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Customer</th>
                    <th className="p-2 text-left">Items</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{new Date(bill.date).toLocaleDateString()}</td>
                      <td className="p-2">{bill.customerName}</td>
                      <td className="p-2">{bill.items.length} items</td>
                      <td className="p-2">₹{bill.total}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadBill(bill)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            title="Download Bill"
                          >
                            <FiDownload size={16} />
                            <span className="hidden sm:inline">Download</span>
                          </button>
                          <button
                            onClick={() => viewBillDetails(bill)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            title="View Details"
                          >
                            <FiSearch size={16} />
                            <span className="hidden sm:inline">View</span>
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
      )}

      {/* Bill Creation View */}
      {viewMode === "create" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Customer Information */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-4">Customer Information</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Customer Name*
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="billDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    id="billDate"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Add Products */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-4">Add Products</h2>
              <div className="space-y-4">
                <div className="relative">
                  <label
                    htmlFor="productSearch"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                      className="w-full p-2 pl-10 border rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Product dropdown with image handling */}
                  {showProductDropdown && searchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <div
                            key={product._id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setCurrentProduct(product);
                              setSearchTerm(product.name);
                              setShowProductDropdown(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-8 h-8 object-cover rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-xs">
                                  📦
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500 flex justify-between">
                                  <span>₹{product.price}</span>
                                  <span>
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
                        <div className="p-2 text-gray-500">No products found</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={currentQuantity}
                    onChange={(e) =>
                      setCurrentQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={addItemToBill}
                  disabled={!currentProduct}
                  className={`w-full flex items-center justify-center gap-2 p-2 rounded ${
                    !currentProduct
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <FiPlus />
                  Add to Bill
                </button>
              </div>
            </div>
          </div>

          {/* Bill Items */}
          <div className="bg-white p-4 rounded-lg shadow mb-6 print:shadow-none">
            <h2 className="text-lg font-medium mb-4">Bill Items</h2>

            {selectedItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No items added to the bill yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-left">Price</th>
                      <th className="p-2 text-left">Quantity</th>
                      <th className="p-2 text-left">Total</th>
                      <th className="p-2 text-left print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {item.product.image ? (
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-8 h-8 object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-xs">
                                📦
                              </div>
                            )}
                            {item.product.name}
                          </div>
                        </td>
                        <td className="p-2">₹{item.product.price}</td>
                        <td className="p-2">
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemQuantity(
                                  index,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 p-1 border rounded"
                            />
                          </div>
                        </td>
                        <td className="p-2">₹{item.lineTotal}</td>
                        <td className="p-2 print:hidden">
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="p-2 text-right font-medium">
                        Total Amount:
                      </td>
                      <td className="p-2 font-bold">₹{billTotal}</td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-between gap-4 print:hidden">
            <div>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  <FiPrinter />
                  Print Bill
                </button>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedItems([]);
                  setCurrentProduct(null);
                  setCurrentQuantity(1);
                  setSearchTerm("");
                  setMessage(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || selectedItems.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded ${
                  isSubmitting || selectedItems.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                    <FiSave />
                    Create Bill
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Print-only receipt template */}
      <div className="hidden print:block mt-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">RECEIPT</h1>
          <p className="text-gray-600">Your Shop Name</p>
          <p className="text-sm text-gray-500">Address, City, State, ZIP</p>
          <p className="text-sm text-gray-500">Phone: (123) 456-7890</p>
        </div>

        <div className="flex justify-between mb-4">
          <div>
            <p><strong>Customer:</strong> {customerName}</p>
          </div>
          <div>
            <p><strong>Date:</strong> {new Date(billDate).toLocaleDateString()}</p>
            <p><strong>Receipt #:</strong> {Math.floor(Math.random() * 1000000)}</p>
          </div>
        </div>

        <hr className="mb-4" />
        
        {/* Item details are rendered from the existing bill items table */}
      </div>
    </div>
  );
}