import React from 'react';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'مدير النظام',
      manager: 'مدير',
      cashier: 'كاشير'
    };
    return roles[role] || role;
  };

  return (
    <header className="bg-white shadow-md h-16 fixed top-0 right-64 left-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <FaSignOutAlt />
            <span>تسجيل الخروج</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-semibold text-gray-800">{user?.full_name}</div>
            <div className="text-sm text-gray-500">{getRoleLabel(user?.role)}</div>
          </div>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <FaUser className="text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
