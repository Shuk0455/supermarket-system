import React, { useState, useEffect } from 'react';
import { FaEye, FaSearch } from 'react-icons/fa';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const fetchInvoices = async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.invoice_type = filter;
      }
      const response = await axios.get('/invoices', { params });
      setInvoices(response.data);
    } catch (error) {
      toast.error('فشل تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const viewInvoiceDetails = async (invoiceId) => {
    try {
      const response = await axios.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(response.data);
      setShowModal(true);
    } catch (error) {
      toast.error('فشل تحميل تفاصيل الفاتورة');
    }
  };

  const getInvoiceTypeLabel = (type) => {
    const types = { sale: 'مبيعات', purchase: 'مشتريات', return: 'مرتجعات' };
    return types[type] || type;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = { cash: 'نقدي', card: 'بطاقة', electronic: 'إلكتروني', mixed: 'مختلط' };
    return methods[method] || method;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">إدارة الفواتير</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter('sale')}
            className={`px-4 py-2 rounded-lg ${filter === 'sale' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            مبيعات
          </button>
          <button
            onClick={() => setFilter('purchase')}
            className={`px-4 py-2 rounded-lg ${filter === 'purchase' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
          >
            مشتريات
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right">رقم الفاتورة</th>
                  <th className="px-6 py-3 text-right">النوع</th>
                  <th className="px-6 py-3 text-right">المستخدم</th>
                  <th className="px-6 py-3 text-right">العميل</th>
                  <th className="px-6 py-3 text-right">طريقة الدفع</th>
                  <th className="px-6 py-3 text-right">الإجمالي</th>
                  <th className="px-6 py-3 text-right">التاريخ</th>
                  <th className="px-6 py-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{invoice.invoice_number}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        invoice.invoice_type === 'sale' ? 'bg-green-100 text-green-600' :
                        invoice.invoice_type === 'purchase' ? 'bg-purple-100 text-purple-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {getInvoiceTypeLabel(invoice.invoice_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{invoice.user?.full_name || '-'}</td>
                    <td className="px-6 py-4">{invoice.customer?.name || '-'}</td>
                    <td className="px-6 py-4">{getPaymentMethodLabel(invoice.payment_method)}</td>
                    <td className="px-6 py-4 font-semibold">{Number(invoice.total_amount).toFixed(2)} د</td>
                    <td className="px-6 py-4">
                      {format(new Date(invoice.created_at), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewInvoiceDetails(invoice.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b pb-4 mb-4">
              <h2 className="text-2xl font-bold">فاتورة رقم: {selectedInvoice.invoice_number}</h2>
              <p className="text-gray-600 mt-1">
                {format(new Date(selectedInvoice.created_at), 'EEEE, d MMMM yyyy - HH:mm', { locale: ar })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">المستخدم</p>
                <p className="font-semibold">{selectedInvoice.user?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">العميل</p>
                <p className="font-semibold">{selectedInvoice.customer?.name || 'عميل عام'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">طريقة الدفع</p>
                <p className="font-semibold">{getPaymentMethodLabel(selectedInvoice.payment_method)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">نوع الفاتورة</p>
                <p className="font-semibold">{getInvoiceTypeLabel(selectedInvoice.invoice_type)}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3">المنتجات</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right">المنتج</th>
                    <th className="px-4 py-2 text-right">الكمية</th>
                    <th className="px-4 py-2 text-right">السعر</th>
                    <th className="px-4 py-2 text-right">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{item.product_name}</td>
                      <td className="px-4 py-2">{Number(item.quantity)}</td>
                      <td className="px-4 py-2">{Number(item.unit_price).toFixed(2)}</td>
                      <td className="px-4 py-2">{Number(item.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>الإجمالي الفرعي:</span>
                  <span>{Number(selectedInvoice.subtotal).toFixed(2)} د</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة:</span>
                  <span>{Number(selectedInvoice.tax_amount).toFixed(2)} د</span>
                </div>
                <div className="flex justify-between">
                  <span>الخصم:</span>
                  <span>{Number(selectedInvoice.discount_amount).toFixed(2)} د</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>الإجمالي النهائي:</span>
                  <span>{Number(selectedInvoice.total_amount).toFixed(2)} د</span>
                </div>
                <div className="flex justify-between">
                  <span>المدفوع:</span>
                  <span>{Number(selectedInvoice.paid_amount).toFixed(2)} د</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>الباقي:</span>
                  <span>{Number(selectedInvoice.change_amount).toFixed(2)} د</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
