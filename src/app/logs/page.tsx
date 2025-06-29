"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiActivity, FiSearch, FiDownload, FiFilter, FiX, 
  FiChevronLeft, FiChevronRight, FiArrowLeft, FiHome 
} from "react-icons/fi";

interface LogEntry {
  _id: string;
  type: 'add' | 'buy' | 'sell' | 'bill' | 'credit' | 'payment' | 'delete' | 'update' | 'error';
  description: string;
  timestamp: string;
  relatedItem?: {
    id: string;
    name: string;
    type: string;
  };
}

export default function ActivityLogsPage() {
  // State management
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(true);

  // Fetch logs on component mount and when filters change
  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());
      
      if (typeFilter !== 'all') queryParams.append('type', typeFilter);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (searchTerm) queryParams.append('search', searchTerm);
      
      const response = await fetch(`/api/logs?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchLogs();
  };

  const exportLogs = () => {
    if (!logs.length) return;
    
    const headers = ['Date/Time', 'Action Type', 'Description'];
    
    const csvData = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.type,
        `"${log.description.replace(/"/g, '""')}"` // Escape quotes in CSV
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'add': return 'bg-green-100 text-green-800';
      case 'buy': return 'bg-blue-100 text-blue-800';
      case 'sell': return 'bg-red-100 text-red-800';
      case 'bill': return 'bg-purple-100 text-purple-800';
      case 'credit': return 'bg-orange-100 text-orange-800';
      case 'payment': return 'bg-teal-100 text-teal-800';
      case 'delete': return 'bg-gray-100 text-gray-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'add': return '➕';
      case 'buy': return '🛒';
      case 'sell': return '💰';
      case 'bill': return '🧾';
      case 'credit': return '💳';
      case 'payment': return '💵';
      case 'delete': return '🗑️';
      case 'update': return '✏️';
      case 'error': return '⚠️';
      default: return '📝';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                <span className="text-white">Activity Logs</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <FiActivity className="h-6 w-6" /> Activity Logs
              </h1>
            </div>
            <Link 
              href="/" 
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
          
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center text-gray-700 font-medium">
                <FiFilter className="mr-2" /> Filter & Search Options
              </span>
              <span className="text-gray-400">
                {showFilters ? <FiChevronLeft /> : <FiChevronRight />}
              </span>
            </button>
          </div>
          
          {showFilters && (
            <form onSubmit={handleSearch} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm"
                  >
                    <option value="all">All Actions</option>
                    <option value="add">Add</option>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                    <option value="bill">Bill</option>
                    <option value="credit">Credit</option>
                    <option value="payment">Payment</option>
                    <option value="delete">Delete</option>
                    <option value="update">Update</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Description
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <FiSearch className="text-gray-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search in logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 sm:px-4 sm:py-3 sm:pl-10 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-3">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-black to-gray-800 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all duration-300 flex items-center justify-center"
                  >
                    <FiFilter className="mr-2" /> Apply Filters
                  </button>
                  
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
                  >
                    <FiX className="mr-2" /> Clear Filters
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={exportLogs}
                  disabled={logs.length === 0}
                  className={`w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium flex items-center justify-center mt-3 sm:mt-0 ${
                    logs.length === 0 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700 transition-all duration-300'
                  }`}
                >
                  <FiDownload className="mr-2" /> Export to CSV
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiActivity className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No logs found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Try adjusting your filters or search criteria to find the activity logs you're looking for.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center"
              >
                <FiX className="mr-2" /> Clear All Filters
              </button>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs rounded-full inline-flex items-center gap-1 ${getActionColor(log.type)}`}>
                            <span>{getActionIcon(log.type)}</span>
                            {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {logs.map((log) => (
                  <div key={log._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-3 py-1 text-xs rounded-full inline-flex items-center gap-1 ${getActionColor(log.type)}`}>
                        <span>{getActionIcon(log.type)}</span>
                        {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{log.description}</p>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 gap-3">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center sm:justify-end">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-black text-white hover:bg-gray-800 transition-colors'
                      }`}
                    >
                      <FiChevronLeft className="mr-1" /> Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        currentPage === totalPages 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-black text-white hover:bg-gray-800 transition-colors'
                      }`}
                    >
                      Next <FiChevronRight className="ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Summary */}
        {!loading && logs.length > 0 && (
          <div className="mt-4 px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600 flex justify-between items-center">
            <span>Total logs found: <span className="font-medium">{logs.length}</span></span>
            <span className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}