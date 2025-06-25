"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

// Credit type definition with support for both field naming conventions
type CreditItem = {
  productName: string;
  product?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  // For backward compatibility with frontend
  itemName?: string;
  price?: number;
};

type Credit = {
  _id: string;
  name: string;
  phoneNumber: string;  // Backend field
  phone?: string;       // Frontend field for compatibility
  date: string;
  items: CreditItem[];
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;  // Backend field
  remaining?: number;       // Frontend field for compatibility
  images: string[];
  type: 'given' | 'taken';
  isPaid: boolean;
  paymentHistory: {
    amount: number;
    date: string;
  }[];
};

export default function CreditsPage() {
  const [activeTab, setActiveTab] = useState<'given' | 'taken'>('given');
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [expandedCreditId, setExpandedCreditId] = useState<string | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalGiven, setTotalGiven] = useState(0);
  const [totalTaken, setTotalTaken] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  
  // Define the type for an item in the form
  type FormItem = {
    itemName: string;
    quantity: number;
    price: number;
  };

  // Form state for new credit entry
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    date: string;
    type: 'given' | 'taken';
    items: FormItem[];
    images: File[];
  }>({
    name: '',
    phone: '',
    date: new Date().toISOString().slice(0, 10),
    type: activeTab,
    items: [{ itemName: '', quantity: 1, price: 0 }],
    images: []
  });
  
  // Form state for payment
  const [paymentAmount, setPaymentAmount] = useState(0);
  
  // Fetch credits on component mount and when tab changes
  useEffect(() => {
    fetchCredits();
  }, [activeTab]);
  
  // Calculate totals
  useEffect(() => {
    if (credits.length) {
      let given = 0;
      let taken = 0;
      
      credits.forEach(credit => {
        // Support both field names
        const remainingAmount = credit.remainingAmount || credit.remaining || 0;
        
        if (credit.type === 'given') {
          given += remainingAmount;
        } else {
          taken += remainingAmount;
        }
      });
      
      setTotalGiven(given);
      setTotalTaken(taken);
      setNetBalance(taken - given);
    }
  }, [credits]);
  
  // Fetch all credits
  const fetchCredits = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('type', activeTab);
      
      if (searchTerm) queryParams.append('name', searchTerm);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const res = await fetch(`/api/credits?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch credit data');
      
      const data = await res.json();
      setCredits(data);
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle item form changes
  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    if (field === 'itemName') {
      newItems[index].itemName = value;
    } else if (field === 'quantity') {
      newItems[index].quantity = parseFloat(value) || 0;
    } else if (field === 'price') {
      newItems[index].price = parseFloat(value) || 0;
    }
    setFormData({ ...formData, items: newItems });
  };

  // Handle input changes for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Add new item row
  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', quantity: 1, price: 0 }]
    });
  };
  
  // Remove item row
  const removeItemRow = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems.length ? newItems : [{ itemName: '', quantity: 1, price: 0 }] });
  };
  
  // Handle image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFormData({ ...formData, images: [...formData.images, ...fileArray] });
    }
  };
  
  // Remove image from selection
  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };
  
  // Calculate total amount of items
  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };
  
  // Submit new credit entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First upload images if any
      const imageUrls: string[] = [];
      
      if (formData.images.length > 0) {
        const uploadFormData = new FormData();
        formData.images.forEach(file => {
          uploadFormData.append('files', file);
        });
        
        console.log('Uploading images...');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          throw new Error(`Failed to upload images: ${errorText}`);
        }
        
        const uploadData = await uploadRes.json();
        console.log('Upload response:', uploadData);
        
        if (uploadData.files) {
          imageUrls.push(...uploadData.files);
        }
      }
      
      // Calculate total amount
      const totalAmount = calculateTotal();
      
      // Transform items to match the expected schema
      const transformedItems = formData.items.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
        // These fields will be transformed in the API
      }));
      
      // Prepare data for submission
      const creditData = {
        name: formData.name,
        phone: formData.phone,  // API will transform this to phoneNumber
        date: formData.date, 
        items: transformedItems,
        totalAmount,
        amountPaid: 0,
        images: imageUrls,
        type: formData.type
      };
      
      console.log('Submitting credit data:', creditData);
      
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creditData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to create credit: ${errorData.error || res.statusText}`);
      }
      
      const createdCredit = await res.json();
      console.log('Credit created:', createdCredit);
      
      // Reset form and close modal
      setFormData({
        name: '',
        phone: '',
        date: new Date().toISOString().slice(0, 10),
        type: activeTab,
        items: [{ itemName: '', quantity: 1, price: 0 }],
        images: []
      });
      
      setShowModal(false);
      fetchCredits();
    } catch (error) {
      console.error("Error creating credit entry:", error);
      alert(`Failed to create credit entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCredit) return;
    
    try {
      const res = await fetch(`/api/credits/${selectedCredit._id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: paymentAmount }),
      });
      
      if (!res.ok) throw new Error('Failed to process payment');
      
      // Reset and close modal
      setPaymentAmount(0);
      setShowPaymentModal(false);
      setSelectedCredit(null);
      fetchCredits();
    } catch (error) {
      console.error("Error processing payment:", error);
      alert('Failed to process payment. Please try again.');
    }
  };
  
  // Handle expanding a credit entry to show details
  const toggleExpandCredit = (id: string) => {
    if (expandedCreditId === id) {
      setExpandedCreditId(null);
    } else {
      setExpandedCreditId(id);
    }
  };
  
  // Open payment modal for a credit
  const openPaymentModal = (credit: Credit) => {
    setSelectedCredit(credit);
    setPaymentAmount(0);
    setShowPaymentModal(true);
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    fetchCredits();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    fetchCredits();
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Credit Management</h1>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Credit Given</h3>
          <p className="text-2xl font-bold text-green-700">₹{totalGiven.toFixed(2)}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Credit Taken</h3>
          <p className="text-2xl font-bold text-red-700">₹{totalTaken.toFixed(2)}</p>
        </div>
        <div className={`p-4 rounded-lg shadow ${netBalance >= 0 ? 'bg-blue-100' : 'bg-yellow-100'}`}>
          <h3 className="text-sm text-gray-500">Net Balance</h3>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-700' : 'text-yellow-700'}`}>
            ₹{Math.abs(netBalance).toFixed(2)} {netBalance >= 0 ? '(To Give)' : '(To Take)'}
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex mb-6">
        <button 
          className={`px-4 py-2 rounded-l-lg ${activeTab === 'given' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('given')}
        >
          Credit Given
        </button>
        <button 
          className={`px-4 py-2 rounded-r-lg ${activeTab === 'taken' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('taken')}
        >
          Credit Taken
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Name</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex items-end gap-2">
            <button 
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Apply Filters
            </button>
            <button 
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Add New Button */}
      <div className="mb-6">
        <button 
          onClick={() => {
            setFormData({
              ...formData,
              type: activeTab,
              date: new Date().toISOString().slice(0, 10)
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add New Credit Entry
        </button>
      </div>
      
      {/* Credit List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : credits.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No credit entries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {credits.map((credit) => (
                  <React.Fragment key={credit._id}>
                    <tr className={credit.isPaid ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">{credit.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{credit.phoneNumber || credit.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(credit.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{credit.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{credit.amountPaid.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{(credit.remainingAmount || credit.remaining || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          credit.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {credit.isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => toggleExpandCredit(credit._id)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          {expandedCreditId === credit._id ? 'Hide' : 'View'}
                        </button>
                        {!credit.isPaid && (
                          <button 
                            onClick={() => openPaymentModal(credit)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {expandedCreditId === credit._id && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 bg-gray-50">
                          <div className="border-t border-b py-4">
                            <h4 className="font-medium mb-2">Items:</h4>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              {credit.items.map((item, idx) => (
                                <div key={idx} className="border p-2 rounded">
                                  <p className="text-sm font-medium">{item.productName || item.itemName}</p>
                                  <p className="text-xs text-gray-500">
                                    {item.quantity} × ₹{(item.unitPrice || item.price || 0).toFixed(2)} = 
                                    ₹{(item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0))).toFixed(2)}
                                  </p>
                                </div>
                              ))}
                            </div>
                            
                            {credit.images && credit.images.length > 0 && (
                              <>
                                <h4 className="font-medium mb-2">Attachments:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {credit.images.map((img, idx) => (
                                    <div key={idx} className="relative w-24 h-24 border rounded overflow-hidden">
                                      <Image 
                                        src={img} 
                                        alt="Receipt" 
                                        width={96}
                                        height={96}
                                        className="cursor-pointer object-cover"
                                        onClick={() => window.open(img, '_blank')}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                            
                            {credit.paymentHistory && credit.paymentHistory.length > 0 && (
                              <>
                                <h4 className="font-medium mb-2 mt-4">Payment History:</h4>
                                <div className="space-y-1">
                                  {credit.paymentHistory.map((payment, idx) => (
                                    <div key={idx} className="text-sm">
                                      <span className="font-medium">₹{payment.amount.toFixed(2)}</span>
                                      <span className="text-gray-500 ml-2">on {new Date(payment.date).toLocaleDateString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* New Credit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Credit</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="given">Credit Given</option>
                      <option value="taken">Credit Taken</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items</label>
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          className="w-full p-2 border rounded"
                          placeholder="Item name"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full p-2 border rounded"
                          placeholder="Qty"
                          min="1"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          className="w-full p-2 border rounded"
                          placeholder="Price"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={formData.items.length <= 1}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center mt-2">
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm"
                    >
                      Add Item
                    </button>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Total:</span>
                      <span className="ml-2 font-bold">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full p-2 border rounded"
                  />
                  
                  {formData.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.images.map((file, index) => (
                        <div key={index} className="relative w-16 h-16 border rounded overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save Credit Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Record Payment</h2>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">Recording payment for:</p>
                <p className="font-medium">{selectedCredit.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount:</p>
                    <p className="font-medium">₹{selectedCredit.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining:</p>
                    <p className="font-medium">₹{(selectedCredit.remainingAmount || selectedCredit.remaining || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handlePaymentSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                    placeholder="Enter amount"
                    min="0.01"
                    max={selectedCredit.remainingAmount || selectedCredit.remaining || 0}
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentAmount(selectedCredit.remainingAmount || selectedCredit.remaining || 0);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Full Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}