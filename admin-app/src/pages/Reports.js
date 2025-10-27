import React, { useState } from 'react';
import { FaDownload, FaChartLine } from 'react-icons/fa';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const Reports = () => {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('يرجى اختيار تاريخ البداية والنهاية');
      return;
    }

    setLoading(true);
    try {
      if (reportType === 'sales') {
        const response = await axios.get('/reports/sales', {
          params: { start_date: startDate, end_date: endDate }
        });
        setReportData(response.data);
      }
    } catch (error) {
      toast.error('فشل إنشاء التقرير');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const response = await axios.get('/reports/products/low-stock');
      setLowStockProducts(response.data);
    } catch (error) {
      toast.error('فشل تحميل المنتجات');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">التقارير</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">إنشاء تقرير</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">نوع التقرير</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="sales">تقرير المبيعات</option>
              <option value="inventory">تقرير المخزون</option>
              <option value="profit">تقرير الأرباح</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FaChartLine /> {loading ? 'جاري...' : 'إنشاء'}
            </button>
          </div>
        </div>
      </div>

      {reportData && reportType === 'sales' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">تقرير المبيعات</h2>
            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <FaDownload /> تحميل PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-blue-600">{Number(reportData.total_sales).toFixed(2)} د</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">عدد الفواتير</p>
              <p className="text-2xl font-bold text-green-600">{reportData.total_invoices}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">مبيعات نقدية</p>
              <p className="text-2xl font-bold text-purple-600">{Number(reportData.cash_sales).toFixed(2)} د</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">مبيعات بطاقة</p>
              <p className="text-2xl font-bold text-yellow-600">{Number(reportData.card_sales).toFixed(2)} د</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">المنتجات منخفضة المخزون</h2>
          <button
            onClick={fetchLowStockProducts}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            تحديث
          </button>
        </div>

        {lowStockProducts.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right">المنتج</th>
                <th className="px-6 py-3 text-right">الباركود</th>
                <th className="px-6 py-3 text-right">الكمية الحالية</th>
                <th className="px-6 py-3 text-right">الحد الأدنى</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">{product.barcode}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded">
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">{product.min_stock_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-8 text-gray-600">لا توجد منتجات منخفضة المخزون</p>
        )}
      </div>
    </div>
  );
};

export default Reports;
