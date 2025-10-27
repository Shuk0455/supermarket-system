import React, { useState, useEffect } from 'react';
import { FaBox, FaFileInvoice, FaExclamationTriangle, FaUsers, FaMoneyBillWave } from 'react-icons/fa';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('فشل تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'مبيعات اليوم',
      value: stats?.total_sales_today ? `${Number(stats.total_sales_today).toFixed(2)} دينار` : '0.00 دينار',
      icon: FaMoneyBillWave,
      color: 'bg-green-500',
    },
    {
      title: 'عدد الفواتير اليوم',
      value: stats?.total_invoices_today || 0,
      icon: FaFileInvoice,
      color: 'bg-blue-500',
    },
    {
      title: 'عدد المنتجات',
      value: stats?.total_products || 0,
      icon: FaBox,
      color: 'bg-purple-500',
    },
    {
      title: 'منتجات منخفضة المخزون',
      value: stats?.low_stock_products || 0,
      icon: FaExclamationTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'الورديات النشطة',
      value: stats?.active_shifts || 0,
      icon: FaUsers,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
        <p className="text-gray-600 mt-2">مرحباً بك في نظام إدارة السوبر ماركت</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-2xl text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-2">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">النشاط الأخير</h2>
          <p className="text-gray-600">لا توجد بيانات حالياً</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">المنتجات الأكثر مبيعاً</h2>
          <p className="text-gray-600">لا توجد بيانات حالياً</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
