import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaMoneyBillWave, FaSignOutAlt } from 'react-icons/fa';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const ShiftManagement = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentShift, setCurrentShift] = useState(null);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    checkCurrentShift();
  }, []);

  const checkCurrentShift = async () => {
    try {
      const response = await axios.get('/shifts/current');
      setCurrentShift(response.data);
      localStorage.setItem('current_shift', JSON.stringify(response.data));
    } catch (error) {
      // No active shift
      setCurrentShift(null);
    }
  };

  const handleOpenShift = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/shifts/open', {
        opening_balance: parseFloat(openingBalance),
        notes: notes
      });
      
      setCurrentShift(response.data);
      localStorage.setItem('current_shift', JSON.stringify(response.data));
      toast.success('تم فتح الوردية بنجاح');
      navigate('/pos');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل فتح الوردية');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!closingCash) {
      toast.error('يرجى إدخال المبلغ الفعلي في الصندوق');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`/shifts/${currentShift.id}/close`, {
        actual_cash: parseFloat(closingCash),
        notes: notes
      });
      
      toast.success('تم إغلاق الوردية بنجاح');
      localStorage.removeItem('current_shift');
      setCurrentShift(null);
      setShowCloseModal(false);
      setClosingCash('');
      setNotes('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل إغلاق الوردية');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (currentShift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <FaClock className="text-6xl text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">وردية نشطة</h1>
            <p className="text-gray-600">مرحباً {user?.full_name}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">رصيد الافتتاح</p>
                <p className="text-2xl font-bold text-blue-600">{Number(currentShift.opening_balance).toFixed(2)} د</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">وقت الفتح</p>
                <p className="text-lg font-bold">{new Date(currentShift.opened_at).toLocaleTimeString('ar')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/pos')}
              className="w-full bg-green-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-green-700 transition-all"
            >
              متابعة البيع
            </button>

            <button
              onClick={() => setShowCloseModal(true)}
              className="w-full bg-orange-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-orange-700 transition-all"
            >
              إغلاق الوردية
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-all"
            >
              <FaSignOutAlt className="inline ml-2" />
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* Close Shift Modal */}
        {showCloseModal && (
          <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-6 text-center">إغلاق الوردية</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">المبلغ الفعلي في الصندوق *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    className="w-full px-4 py-3 text-xl font-bold border-2 border-gray-300 rounded-lg"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ملاحظات</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                    placeholder="أي ملاحظات..."
                  ></textarea>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 py-3 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleCloseShift}
                    disabled={loading || !closingCash}
                    className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
                  >
                    {loading ? 'جاري...' : 'تأكيد الإغلاق'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <FaMoneyBillWave className="text-6xl text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">فتح وردية جديدة</h1>
          <p className="text-gray-600">مرحباً {user?.full_name}</p>
        </div>

        <form onSubmit={handleOpenShift} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">رصيد الافتتاح *</label>
            <input
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full px-4 py-3 text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="أي ملاحظات..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري...' : 'فتح الوردية'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            <FaSignOutAlt className="inline ml-2" />
            تسجيل الخروج
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShiftManagement;
