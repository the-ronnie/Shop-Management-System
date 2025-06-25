"use client";

import { useState, useEffect } from "react";
import { FiActivity, FiSearch, FiDownload, FiFilter, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FiActivity className="text-blue-500" /> Activity Logs
      </h1>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 border rounded"
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
                className="w-full p-2 border rounded"
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
                className="w-full p-2 border rounded"
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
                  className="w-full p-2 pl-10 border rounded"
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
          
          <div className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <FiFilter /> Apply Filters
              </button>
              
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
            
            <button
              type="button"
              onClick={exportLogs}
              disabled={logs.length === 0}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                logs.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <FiDownload /> Export to CSV
            </button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
          <p>Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiActivity className="text-gray-400 text-4xl mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-500">No logs found</p>
          <p className="text-gray-400">Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Date/Time</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Action Type</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 text-xs rounded-full inline-flex items-center gap-1 ${getActionColor(log.type)}`}>
                        <span>{getActionIcon(log.type)}</span>
                        {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                      </span>
                    </td>
                    <td className="p-3">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-3 py-4 flex items-center justify-between border-t">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page {currentPage} of {totalPages}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded flex items-center ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FiChevronLeft className="mr-1" /> Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded flex items-center ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next <FiChevronRight className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && logs.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Total logs found: {logs.length}
        </div>
      )}
    </div>
  );
}