"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiShoppingCart, FiUsers, FiDollarSign, FiCreditCard, 
  FiPackage, FiPieChart, FiBarChart2, FiClipboard, FiArrowRight 
} from "react-icons/fi";

// Type definitions
interface Stats {
  totalProducts: number;
  totalCustomers: number;
  totalSales: number;
  outOfStock: number;
}

interface RecentActivity {
  _id: string;
  type: string;
  description: string;
  timestamp: Date;
  relatedItemName?: string;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    outOfStock: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Get dashboard stats
        const statsRes = await fetch('/api/dashboard/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Get recent activity logs
        const logsRes = await fetch('/api/logs?limit=5');
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setRecentActivity(logsData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <FiPackage className="text-green-500" />;
      case 'sell':
        return <FiDollarSign className="text-blue-500" />;
      case 'bill':
        return <FiClipboard className="text-purple-500" />;
      case 'delete':
        return <FiDollarSign className="text-red-500" />;
      case 'credit':
        return <FiCreditCard className="text-amber-500" />;
      case 'payment':
        return <FiDollarSign className="text-emerald-500" />;
      default:
        return <FiBarChart2 className="text-gray-500" />;
    }
  };

  // Format date in a readable way
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-black to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Shop Management System
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-2xl">
              Manage your inventory, track sales, handle credits, and oversee your entire shop operations from one powerful dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/products" className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center">
                View Products
                <FiArrowRight className="ml-2" />
              </Link>
              <Link href="/billing" className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors flex items-center">
                Create Bill
                <FiArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 flex items-start">
              <div className="bg-blue-50 p-3 rounded-lg">
                <FiPackage size={24} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Products
                </h3>
                <div className="mt-1 flex items-baseline">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</span>
                  )}
                </div>
                <div className="mt-1">
                  <Link href="/products" className="text-sm text-blue-600 hover:text-blue-800">
                    View all products
                  </Link>
                </div>
              </div>
            </div>
          </div>

          

          {/* Total Sales Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 flex items-start">
              <div className="bg-green-50 p-3 rounded-lg">
                <FiDollarSign size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Sales
                </h3>
                <div className="mt-1 flex items-baseline">
                  {isLoading ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats.totalSales)}
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <Link href="/billing" className="text-sm text-green-600 hover:text-green-800">
                    View sales history
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Out of Stock Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 flex items-start">
              <div className="bg-red-50 p-3 rounded-lg">
                <FiBarChart2 size={24} className="text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Out of Stock
                </h3>
                <div className="mt-1 flex items-baseline">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-2xl font-semibold text-gray-900">{stats.outOfStock}</span>
                  )}
                </div>
                <div className="mt-1">
                  <Link href="/products?filter=out-of-stock" className="text-sm text-red-600 hover:text-red-800">
                    View out of stock
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="bg-white rounded-xl shadow-md p-5 space-y-3 border border-gray-100">
              <Link href="/billing" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="bg-blue-100 p-2 rounded-md">
                  <FiShoppingCart size={18} className="text-blue-700" />
                </div>
                <div className="ml-3">
                  <span className="font-medium text-gray-900">Create New Bill</span>
                </div>
                <FiArrowRight className="ml-auto text-gray-400" />
              </Link>
              
              <Link href="/add-product" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="bg-green-100 p-2 rounded-md">
                  <FiPackage size={18} className="text-green-700" />
                </div>
                <div className="ml-3">
                  <span className="font-medium text-gray-900">Add New Product</span>
                </div>
                <FiArrowRight className="ml-auto text-gray-400" />
              </Link>
              
              <Link href="/credits" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="bg-amber-100 p-2 rounded-md">
                  <FiCreditCard size={18} className="text-amber-700" />
                </div>
                <div className="ml-3">
                  <span className="font-medium text-gray-900">Manage Credits</span>
                </div>
                <FiArrowRight className="ml-auto text-gray-400" />
              </Link>
              
              <Link href="/reports" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="bg-purple-100 p-2 rounded-md">
                  <FiPieChart size={18} className="text-purple-700" />
                </div>
                <div className="ml-3">
                  <span className="font-medium text-gray-900">View Reports</span>
                </div>
                <FiArrowRight className="ml-auto text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="ml-4 space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentActivity.map((activity) => (
                    <div key={activity._id} className="py-3 flex items-start">
                      <div className="p-2 rounded-full bg-gray-50">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No recent activity found</p>
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Link href="/logs" className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center">
                  View all activity
                  <FiArrowRight className="ml-1" size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}