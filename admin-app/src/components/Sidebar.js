import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBox, FaList, FaUsers, FaUserTie, FaTruck, FaFileInvoice, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { path: '/', icon: FaHome, label: 'لوحة التحكم', roles: ['admin', 'manager', 'cashier'] },
    { path: '/products', icon: FaBox, label: 'المنتجات', roles: ['admin', 'manager'] },
    { path: '/categories', icon: FaList, label: 'التصنيفات', roles: ['admin', 'manager'] },
    { path: '/customers', icon: FaUsers, label: 'العملاء', roles: ['admin', 'manager'] },
    { path: '/suppliers', icon: FaTruck, label: 'الموردين', roles: ['admin', 'manager'] },
    { path: '/invoices', icon: FaFileInvoice, label: 'الفواتير', roles: ['admin', 'manager'] },
    { path: '/reports', icon: FaChartBar, label: 'التقارير', roles: ['admin', 'manager'] },
    { path: '/users', icon: FaUserTie, label: 'المستخدمين', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="w-64 bg-gray-800 text-white h-screen fixed right-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-center mb-8">نظام السوبر ماركت</h1>
        <nav>
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <Icon className="text-xl" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
