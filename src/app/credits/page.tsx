"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FiCreditCard, FiArrowLeft, FiArrowRight, FiPlus, FiSearch, FiCalendar, 
  FiPhone, FiUser, FiX, FiChevronDown, FiChevronUp, FiTrash2, 
  FiDollarSign, FiCheck, FiFilter, FiRefreshCw, FiArrowUp, FiArrowDown
} from 'react-icons/fi';

// Keep your existing type definitions
type CreditItem = {
  productName: string;
  product?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemName?: string;
  price?: number;
};

type Credit = {
  _id: string;
  name: string;
  phoneNumber: string;  
  phone?: string;       
  date: string;
  items: CreditItem[];
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;  
  remaining?: number;       
  images: string[];
  type: 'given' | 'taken';
  isPaid: boolean;
  paymentHistory: {
    amount: number;
    date: string;
  }[];
};

// Add new types for sorting and filtering
type SortField = 'name' | 'date' | 'amount' | '';
type SortDirection = 'asc' | 'desc';
type PaymentStatus = 'all' | 'pending' | 'paid';

export default function CreditsPage() {
  // Keep all your existing state variables and functions
  const [activeTab, setActiveTab] = useState<'given' | 'taken'>('given');
  const [credits, setCredits] = useState<Credit[]>([]);
  const [filteredCredits, setFilteredCredits] = useState<Credit[]>([]);
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
  const [showFilters, setShowFilters] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Add new state for sorting and status filtering
  const [sortField, setSortField] = useState<SortField>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('all');
  
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
  
  // Apply sorting and filtering to credits
  useEffect(() => {
    if (credits.length) {
      let result = [...credits];
      
      // Apply payment status filter
      if (paymentStatus !== 'all') {
        const isPaidStatus = paymentStatus === 'paid';
        result = result.filter(credit => credit.isPaid === isPaidStatus);
      }
      
      // Apply sorting if a sort field is selected
      if (sortField) {
        result.sort((a, b) => {
          let comparison = 0;
          
          if (sortField === 'name') {
            comparison = a.name.localeCompare(b.name);
          } else if (sortField === 'date') {
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          } else if (sortField === 'amount') {
            const aAmount = a.remainingAmount || a.remaining || 0;
            const bAmount = b.remainingAmount || b.remaining || 0;
            comparison = aAmount - bAmount;
          }
          
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
      
      setFilteredCredits(result);
      
      // Calculate totals from the filtered results
      let given = 0;
      let taken = 0;
      
      result.forEach(credit => {
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
  }, [credits, sortField, sortDirection, paymentStatus]);
  
  // Handle clicks outside modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Only close if clicking outside the modal content area
        if ((event.target as Element).classList.contains('modal-overlay')) {
          setShowModal(false);
          setShowPaymentModal(false);
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Format currency consistently
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };
  
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
      setFilteredCredits(data);
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add function to handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // If already sorting by this field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sort indicator icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? <FiArrowUp className="ml-1" /> : <FiArrowDown className="ml-1" />;
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', quantity: 1, price: 0 }]
    });
  };
  
  const removeItemRow = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems.length ? newItems : [{ itemName: '', quantity: 1, price: 0 }] });
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFormData({ ...formData, images: [...formData.images, ...fileArray] });
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };
  
  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

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
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          throw new Error(`Failed to upload images: ${errorText}`);
        }
        
        const uploadData = await uploadRes.json();
        
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
  
  const toggleExpandCredit = (id: string) => {
    if (expandedCreditId === id) {
      setExpandedCreditId(null);
    } else {
      setExpandedCreditId(id);
    }
  };
  
  const openPaymentModal = (credit: Credit) => {
    setSelectedCredit(credit);
    setPaymentAmount(0);
    setShowPaymentModal(true);
  };
  
  const handleApplyFilters = () => {
    fetchCredits();
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setPaymentStatus('all');
    setSortField('');
    fetchCredits();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient and responsive navigation */}
      <div className="bg-gradient-to-r from-gray-700 to-black text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <FiCreditCard className="h-6 w-6 sm:h-7 sm:w-7 mr-3" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Credit Management</h1>
                <p className="text-sm text-gray-100 mt-0.5">Track and manage credit transactions</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Link href="/" 
                className="px-3 py-1.5 text-sm border border-white/30 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <span className="flex items-center">
                  <FiArrowLeft className="mr-1.5" /> Dashboard
                </span>
              </Link>
              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    type: activeTab,
                    date: new Date().toISOString().slice(0, 10)
                  });
                  setShowModal(true);
                }}
                className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <span className="flex items-center">
                  <FiPlus className="mr-1.5" /> New Credit
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards - Responsive grid with hover effects */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-lg">
                <FiArrowRight className="h-5 w-5 text-green-600 transform -rotate-45" />
              </div>
              <div className="ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Credit Given</h3>
                <div className="mt-1.5">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    {formatCurrency(totalGiven)}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-green-600 font-medium">
                    {filteredCredits.filter(c => c.type === 'given').length} entries
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start">
              <div className="bg-red-50 p-2 rounded-lg">
                <FiArrowLeft className="h-5 w-5 text-red-600 transform -rotate-45" />
              </div>
              <div className="ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Credit Taken</h3>
                <div className="mt-1.5">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    {formatCurrency(totalTaken)}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-red-600 font-medium">
                    {filteredCredits.filter(c => c.type === 'taken').length} entries
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start">
              <div className={`p-2 rounded-lg ${netBalance >= 0 ? 'bg-black/10' : 'bg-yellow-50'}`}>
                <FiDollarSign className={`h-5 w-5 ${netBalance >= 0 ? 'text-black' : 'text-yellow-600'}`} />
              </div>
              <div className="ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Net Balance</h3>
                <div className="mt-1.5">
                  <span className={`text-lg sm:text-xl font-bold ${netBalance >= 0 ? 'text-black' : 'text-yellow-600'}`}>
                    {formatCurrency(Math.abs(netBalance))}
                  </span>
                </div>
                <div className="mt-1">
                  <span className={`text-xs font-medium ${netBalance >= 0 ? 'text-black' : 'text-yellow-600'}`}>
                    {netBalance >= 0 ? 'You will receive' : 'You will give'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation - Improved with better active states */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="flex">
            <button 
              className={`flex-1 px-4 py-3 sm:py-4 text-center text-sm sm:text-base font-medium transition-colors ${
                activeTab === 'given' 
                  ? 'bg-black/5 text-black border-b-2 border-black' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('given')}
            >
              <span className="flex items-center justify-center">
                <FiArrowRight className="mr-2" />
                Credit Given
              </span>
            </button>
            <button 
              className={`flex-1 px-4 py-3 sm:py-4 text-center text-sm sm:text-base font-medium transition-colors ${
                activeTab === 'taken' 
                  ? 'bg-black/5 text-black border-b-2 border-black' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('taken')}
            >
              <span className="flex items-center justify-center">
                <FiArrowLeft className="mr-2" />
                Credit Taken
              </span>
            </button>
          </div>
        </div>
        
        {/* Filters - Collapsible for better mobile experience */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center text-gray-700">
                <FiFilter className="mr-2" />
                <span className="font-medium">Filters</span>
              </div>
              <div>
                {showFilters ? (
                  <FiChevronUp className="text-gray-500" />
                ) : (
                  <FiChevronDown className="text-gray-500" />
                )}
              </div>
            </button>
          </div>
          
          {showFilters && (
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search by Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                      placeholder="Enter name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                    />
                  </div>
                </div>
                
                {/* New payment status filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              
              {/* Sort options */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSort('name')}
                    className={`px-3 py-1.5 text-xs rounded-lg flex items-center ${
                      sortField === 'name' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Name {getSortIcon('name')}
                  </button>
                  <button
                    onClick={() => handleSort('date')}
                    className={`px-3 py-1.5 text-xs rounded-lg flex items-center ${
                      sortField === 'date' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Date {getSortIcon('date')}
                  </button>
                  <button
                    onClick={() => handleSort('amount')}
                    className={`px-3 py-1.5 text-xs rounded-lg flex items-center ${
                      sortField === 'amount' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Amount {getSortIcon('amount')}
                  </button>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <button 
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                >
                  <span className="flex items-center">
                    <FiRefreshCw className="mr-1.5" /> Reset
                  </span>
                </button>
                <button 
                  onClick={handleApplyFilters}
                  className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                >
                  <span className="flex items-center">
                    <FiSearch className="mr-1.5" /> Apply Filters
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Credit List - Table for desktop, cards for mobile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black mb-4"></div>
                <p className="text-gray-500">Loading credits...</p>
              </div>
            </div>
          ) : filteredCredits.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-black/10 mb-6">
                <FiCreditCard className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No credits found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {activeTab === 'given' 
                  ? "You haven't given any credits that match your filters." 
                  : "You haven't taken any credits that match your filters."}
              </p>
              <button 
                onClick={() => {
                  setFormData({
                    ...formData,
                    type: activeTab,
                    date: new Date().toISOString().slice(0, 10)
                  });
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="flex items-center">
                  <FiPlus className="mr-1.5" /> Add New Credit
                </span>
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button 
                            onClick={() => handleSort('name')}
                            className="flex items-center font-medium focus:outline-none"
                          >
                            Name {getSortIcon('name')}
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button 
                            onClick={() => handleSort('date')}
                            className="flex items-center font-medium focus:outline-none"
                          >
                            Date {getSortIcon('date')}
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button 
                            onClick={() => handleSort('amount')}
                            className="flex items-center font-medium focus:outline-none"
                          >
                            Remaining {getSortIcon('amount')}
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCredits.map((credit) => (
                        <React.Fragment key={credit._id}>
                          <tr className={`${credit.isPaid ? 'bg-gray-50' : 'hover:bg-gray-50'} transition-colors`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <FiUser className="text-gray-400 mr-2 flex-shrink-0" />
                                <span className="font-medium text-gray-900 truncate max-w-[140px]">{credit.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <FiPhone className="text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-gray-600">{credit.phoneNumber || credit.phone}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <FiCalendar className="text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-gray-600">{new Date(credit.date).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium">{formatCurrency(credit.totalAmount)}</td>
                            <td className="px-6 py-4 text-green-600">{formatCurrency(credit.amountPaid)}</td>
                            <td className="px-6 py-4 font-medium text-red-600">{formatCurrency(credit.remainingAmount || credit.remaining || 0)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                credit.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {credit.isPaid ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => toggleExpandCredit(credit._id)}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                  {expandedCreditId === credit._id ? 'Hide' : 'View'}
                                </button>
                                {!credit.isPaid && (
                                  <button 
                                    onClick={() => openPaymentModal(credit)}
                                    className="px-2 py-1 text-xs bg-green-100 border border-green-200 rounded text-green-700 hover:bg-green-200 transition-colors"
                                  >
                                    Pay
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Details */}
                          {expandedCreditId === credit._id && (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 bg-gray-50">
                                <div className="border-t border-b border-gray-200 py-4">
                                  <div className="mb-4">
                                    <h4 className="font-medium mb-2 text-gray-900">Items:</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {credit.items.map((item, idx) => (
                                        <div key={idx} className="border border-gray-200 p-3 rounded-lg bg-white">
                                          <p className="text-sm font-medium text-gray-900">{item.productName || item.itemName}</p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {item.quantity} × {formatCurrency(item.unitPrice || item.price || 0)} = 
                                            {formatCurrency(item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0)))}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {credit.images && credit.images.length > 0 && (
                                    <div className="mb-4">
                                      <h4 className="font-medium mb-2 text-gray-900">Attachments:</h4>
                                      <div className="flex flex-wrap gap-3">
                                        {credit.images.map((img, idx) => (
                                          <div key={idx} className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                                    </div>
                                  )}
                                  
                                  {credit.paymentHistory && credit.paymentHistory.length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-2 text-gray-900">Payment History:</h4>
                                      <div className="space-y-2">
                                        {credit.paymentHistory.map((payment, idx) => (
                                          <div key={idx} className="flex items-center p-2 bg-white border border-gray-200 rounded-lg">
                                            <FiCheck className="text-green-500 mr-2" />
                                            <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>
                                            <span className="text-gray-500 ml-2">on {new Date(payment.date).toLocaleDateString()}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
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
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredCredits.map((credit) => (
                  <div key={credit._id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <FiUser className="text-gray-400 mr-2" />
                          <h3 className="font-medium text-gray-900">{credit.name}</h3>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <FiCalendar className="text-gray-400 mr-2" />
                          {new Date(credit.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <FiPhone className="text-gray-400 mr-2" />
                          {credit.phoneNumber || credit.phone}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        credit.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {credit.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Total:</div>
                        <div className="font-medium">{formatCurrency(credit.totalAmount)}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Paid:</div>
                        <div className="font-medium text-green-600">{formatCurrency(credit.amountPaid)}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Remaining:</div>
                        <div className="font-medium text-red-600">{formatCurrency(credit.remainingAmount || credit.remaining || 0)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end space-x-2">
                      <button 
                        onClick={() => toggleExpandCredit(credit._id)}
                        className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        {expandedCreditId === credit._id ? 'Hide Details' : 'View Details'}
                      </button>
                      {!credit.isPaid && (
                        <button 
                          onClick={() => openPaymentModal(credit)}
                          className="px-3 py-1.5 text-xs bg-green-100 border border-green-200 rounded-lg text-green-700 hover:bg-green-200 transition-colors"
                        >
                          Make Payment
                        </button>
                      )}
                    </div>
                    
                    {/* Mobile Expanded Details */}
                    {expandedCreditId === credit._id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 text-gray-900">Items:</h4>
                          <div className="space-y-2">
                            {credit.items.map((item, idx) => (
                              <div key={idx} className="border border-gray-200 p-3 rounded-lg bg-white">
                                <p className="text-sm font-medium text-gray-900">{item.productName || item.itemName}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.quantity} × {formatCurrency(item.unitPrice || item.price || 0)} = 
                                  {formatCurrency(item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0)))}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {credit.images && credit.images.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2 text-gray-900">Attachments:</h4>
                            <div className="flex flex-wrap gap-2">
                              {credit.images.map((img, idx) => (
                                <div key={idx} className="relative w-20 h-20 border border-gray-200 rounded overflow-hidden">
                                  <Image 
                                    src={img} 
                                    alt="Receipt" 
                                    width={80}
                                    height={80}
                                    className="cursor-pointer object-cover"
                                    onClick={() => window.open(img, '_blank')}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {credit.paymentHistory && credit.paymentHistory.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 text-gray-900">Payment History:</h4>
                            <div className="space-y-2">
                              {credit.paymentHistory.map((payment, idx) => (
                                <div key={idx} className="flex items-center p-2 bg-white border border-gray-200 rounded-lg">
                                  <FiCheck className="text-green-500 mr-2" />
                                  <div>
                                    <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>
                                    <div className="text-xs text-gray-500">on {new Date(payment.date).toLocaleDateString()}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* New Credit Modal - Improved for better mobile experience */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" ref={modalRef}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {formData.type === 'given' ? 'Give Credit' : 'Take Credit'}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black shadow-sm"
                        placeholder="Enter name"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black shadow-sm"
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black shadow-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-black focus:border-black rounded-lg shadow-sm"
                      required
                    >
                      <option value="given">Credit Given</option>
                      <option value="taken">Credit Taken</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                    >
                      <FiPlus className="-ml-0.5 mr-1 h-4 w-4" /> Add Item
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                        <div className="col-span-12 sm:col-span-6">
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                            className="shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Item name"
                            required
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Qty"
                            min="1"
                            required
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                              className="focus:ring-black focus:border-black block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                              placeholder="Price"
                              step="0.01"
                              min="0"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="text-red-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={formData.items.length <= 1}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    <div className="text-right bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500">Total Amount:</div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(calculateTotal())}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-black hover:text-gray-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black">
                          <span>Upload images</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                  
                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {formData.images.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="h-full w-full object-cover object-center"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:w-auto mt-3 sm:mt-0 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    Save Credit Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Modal - Touch-friendly design */}
      {showPaymentModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" ref={modalRef}>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center mb-2">
                  <FiUser className="text-gray-400 mr-2" />
                  <span className="font-medium text-gray-900">{selectedCredit.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Total Amount:</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(selectedCredit.totalAmount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Remaining:</div>
                    <div className="font-semibold text-red-600">{formatCurrency(selectedCredit.remainingAmount || selectedCredit.remaining || 0)}</div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handlePaymentSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black shadow-sm"
                      placeholder="Enter amount"
                      min="0.01"
                      max={selectedCredit.remainingAmount || selectedCredit.remaining || 0}
                      step="0.01"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentAmount(selectedCredit.remainingAmount || selectedCredit.remaining || 0);
                        }}
                        className="px-3 py-1 mr-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
                      >
                        Max
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Remaining after this payment: {formatCurrency((selectedCredit.remainingAmount || selectedCredit.remaining || 0) - paymentAmount)}
                  </p>
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full sm:w-auto mt-3 sm:mt-0 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    <span className="flex items-center justify-center">
                      <FiCheck className="mr-1.5" /> Record Payment
                    </span>
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