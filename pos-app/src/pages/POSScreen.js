import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaMinus, FaTrash, FaBarcode, FaUser, FaCashRegister, FaPrint, FaTimes, FaCreditCard, FaMoneyBill, FaMobileAlt } from 'react-icons/fa';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const POSScreen = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    checkCurrentShift();
  }, []);

  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [cart]);

  const checkCurrentShift = async () => {
    try {
      const response = await axios.get('/shifts/current');
      setCurrentShift(response.data);
      localStorage.setItem('current_shift', JSON.stringify(response.data));
    } catch (error) {
      console.log('No active shift found');
      const savedShift = localStorage.getItem('current_shift');
      if (savedShift) setCurrentShift(JSON.parse(savedShift));
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('فشل تحميل المنتجات');
    }
  };

  const handleBarcodeSearch = async (e) => {
    if (e.key === 'Enter' && barcode) {
      try {
        const response = await axios.get(`/products/barcode/${barcode}`);
        addToCart(response.data);
        setBarcode('');
      } catch {
        toast.error('المنتج غير موجود');
        setBarcode('');
      }
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock_quantity) {
        toast.error('الكمية المتاحة غير كافية');
        return;
      }
      setCart(cart.map(item => item.id === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item
      ));
    } else {
      if (product.stock_quantity < 1) {
        toast.error('المنتج غير متوفر في المخزون');
        return;
      }
      setCart([...cart, {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        price: parseFloat(product.selling_price),
        tax_rate: parseFloat(product.tax_rate),
        quantity: 1,
        stock_quantity: product.stock_quantity
      }]);
    }
    toast.success(`تم إضافة ${product.name}`);
  };

  const updateQuantity = (id, qty) => {
    const item = cart.find(i => i.id === id);
    if (qty > item.stock_quantity) {
      toast.error('الكمية المتاحة غير كافية');
      return;
    }
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

  const clearCart = () => { 
    if (cart.length > 0) {
      if (window.confirm('هل تريد مسح السلة بالكامل؟')) {
        setCart([]); 
        setBarcode('');
      }
    }
  };

  const findCustomerByPhone = async () => {
    if (!customerPhone) return;
    try {
      const response = await axios.get(`/customers?search=${customerPhone}`);
      if (response.data.length > 0) {
        setCustomer(response.data[0]);
        toast.success(`تم التعرف على العميل: ${response.data[0].name}`);
      } else {
        setCustomer(null);
        toast.info('عميل جديد - سيتم إنشاء سجل جديد');
      }
    } catch (error) {
      console.error('Error finding customer:', error);
    }
  };

  const calculateSubtotal = () => cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const calculateTax = () => cart.reduce((s, i) => s + (i.price * i.quantity * i.tax_rate / 100), 0);
  const calculateTotal = () => calculateSubtotal() + calculateTax();
  const calculateChange = () => (parseFloat(paidAmount) || 0) - calculateTotal();

  const handleCheckout = () => {
    if (cart.length === 0) return toast.error('السلة فارغة');
    setShowPaymentModal(true);
    setPaidAmount(calculateTotal().toFixed(2));
  };

  const handleNumpadClick = (val) => {
    if (val === 'clear') setPaidAmount('');
    else if (val === 'backspace') setPaidAmount(paidAmount.slice(0, -1));
    else if (val === '00') setPaidAmount(paidAmount + '00');
    else setPaidAmount(paidAmount + val);
  };

  const processPayment = async () => {
    const paid = parseFloat(paidAmount);
    const total = calculateTotal();
    if (paid < total) return toast.error('المبلغ المدفوع أقل من الإجمالي');

    try {
      // إنشاء عميل جديد إذا لم يكن موجوداً
      let customerId = null;
      if (customerPhone && !customer) {
        try {
          const customerResponse = await axios.post('/customers', {
            name: 'عميل جديد',
            phone: customerPhone,
            email: '',
            address: ''
          });
          customerId = customerResponse.data.id;
        } catch (error) {
          console.error('Error creating customer:', error);
        }
      } else if (customer) {
        customerId = customer.id;
      }

      const invoiceData = {
        invoice_type: 'sale',
        payment_method: paymentMethod,
        paid_amount: paid,
        discount_amount: 0,
        customer_id: customerId,
        items: cart.map(i => ({
          product_id: i.id,
          quantity: i.quantity,
          unit_price: i.price,
          tax_rate: i.tax_rate,
          discount: 0
        }))
      };

      const response = await axios.post('/invoices', invoiceData);
      toast.success(`تم إتمام البيع - فاتورة رقم: ${response.data.invoice_number}`);
      
      // طباعة الإيصال
      await printReceipt(response.data);
      
      // مسح البيانات
      clearCart();
      setPaidAmount('');
      setShowPaymentModal(false);
      setCustomerPhone('');
      setCustomer(null);
      
      // تحديث البيانات
      fetchProducts();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.detail || 'فشل إتمام البيع');
    }
  };

  const printReceipt = async (invoice) => {
    try {
      const receiptWindow = window.open('', '_blank');
      const receiptContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>إيصال ${invoice.invoice_number}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              max-width: 300px;
              margin: 0 auto;
              padding: 20px;
              direction: rtl;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .store-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .invoice-number {
              font-size: 14px;
              margin-bottom: 5px;
            }
            .date {
              font-size: 12px;
              color: #666;
            }
            .items {
              margin: 15px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding-bottom: 5px;
              border-bottom: 1px dotted #ddd;
            }
            .item-name {
              flex: 2;
            }
            .item-details {
              flex: 1;
              text-align: left;
            }
            .totals {
              margin-top: 15px;
              border-top: 2px dashed #000;
              padding-top: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .grand-total {
              font-weight: bold;
              font-size: 16px;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 11px;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">سوبر ماركت</div>
            <div class="invoice-number">فاتورة #${invoice.invoice_number}</div>
            <div class="date">${new Date().toLocaleString('ar-SA')}</div>
            <div>${user?.full_name || 'النظام'}</div>
          </div>
          
          <div class="items">
            ${invoice.items?.map(item => `
              <div class="item-row">
                <div class="item-name">${item.product_name}</div>
                <div class="item-details">
                  ${item.quantity} × ${parseFloat(item.unit_price).toFixed(2)} = ${parseFloat(item.total_price).toFixed(2)}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="totals">
            <div class="total-row">
              <span>المجموع:</span>
              <span>${parseFloat(invoice.subtotal).toFixed(2)} د.ع</span>
            </div>
            <div class="total-row">
              <span>الضريبة:</span>
              <span>${parseFloat(invoice.tax_amount).toFixed(2)} د.ع</span>
            </div>
            <div class="total-row grand-total">
              <span>الإجمالي:</span>
              <span>${parseFloat(invoice.total_amount).toFixed(2)} د.ع</span>
            </div>
            <div class="total-row">
              <span>المدفوع:</span>
              <span>${parseFloat(invoice.paid_amount).toFixed(2)} د.ع</span>
            </div>
            <div class="total-row">
              <span>الباقي:</span>
              <span>${parseFloat(invoice.change_amount).toFixed(2)} د.ع</span>
            </div>
          </div>
          
          <div class="footer">
            <div>شكراً لزيارتكم</div>
            <div>نتمنى لكم يومًا سعيداً</div>
          </div>
        </body>
        </html>
      `;
      
      receiptWindow.document.write(receiptContent);
      receiptWindow.document.close();
      
      // انتظر قليلاً ثم اطبع
      setTimeout(() => {
        receiptWindow.print();
        setTimeout(() => receiptWindow.close(), 500);
      }, 500);
      
    } catch (error) {
      console.error('Print error:', error);
      toast.info('تم البيع بنجاح - يمكنك طباعة الإيصال لاحقاً');
    }
  };

  // مكون لوحة الأرقام
  const Numpad = () => (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {[1,2,3,4,5,6,7,8,9,'00',0,'⌫'].map(num => (
        <button 
          key={num} 
          onClick={() => handleNumpadClick(num === '⌫' ? 'backspace' : num)}
          className="numpad-btn bg-gray-100 hover:bg-gray-200 rounded-lg p-3 text-lg font-bold transition-colors duration-200 active:scale-95"
        >
          {num}
        </button>
      ))}
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* الجانب الأيسر - المنتجات */}
      <div className="flex-1 flex flex-col p-4">
        {/* شريط البحث */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex gap-3 mb-3">
            <div className="flex-1 relative">
              <FaBarcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={handleBarcodeSearch}
                placeholder="امسح الباركود أو ابحث عن منتج..."
                className="w-full pr-12 pl-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex-1 relative">
              <FaUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                onBlur={findCustomerByPhone}
                placeholder="رقم هاتف العميل (اختياري)"
                className="w-full pr-12 pl-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
          {customer && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex justify-between items-center">
                <span className="text-green-800 font-bold">{customer.name}</span>
                <span className="text-green-600">{customer.phone}</span>
              </div>
            </div>
          )}
        </div>

        {/* قائمة المنتجات */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-4 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">المنتجات المتاحة</h2>
            <span className="text-sm text-gray-500">{products.length} منتج</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="product-card bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 active:scale-95"
              >
                <h3 className="font-bold text-sm mb-1 truncate" title={product.name}>{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2 truncate">{product.barcode}</p>
                <p className="text-lg font-bold text-blue-600 mb-1">{parseFloat(product.selling_price).toFixed(2)} د.ع</p>
                <div className="flex justify-between items-center text-xs">
                  <span className={`px-2 py-1 rounded-full ${product.stock_quantity > 10 ? 'bg-green-100 text-green-800' : product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {product.stock_quantity} متوفر
                  </span>
                  {product.tax_rate > 0 && (
                    <span className="text-red-500">+{product.tax_rate}% ضريبة</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* الجانب الأيمن - السلة */}
      <div className="w-[450px] bg-white shadow-lg flex flex-col border-r">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">نقطة البيع</h1>
              <p className="text-sm opacity-90">{user?.full_name}</p>
            </div>
            {currentShift && (
              <div className="text-right text-sm bg-blue-500 px-3 py-1 rounded-lg">
                <p className="opacity-90">وردية نشطة</p>
                <p className="font-bold">#{currentShift.id.slice(-6)}</p>
              </div>
            )}
          </div>
        </div>

        {/* محتويات السلة */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">عناصر الفاتورة ({cart.length})</h2>
            {cart.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
              >
                <FaTrash size={12} />
                مسح الكل
              </button>
            )}
          </div>
          
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <FaCashRegister size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">السلة فارغة</p>
              <p className="text-sm">ابدأ بمسح الباركود أو اختيار المنتجات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="cart-item bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.barcode}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center transition-colors active:scale-95"
                      >
                        <FaMinus size={10} />
                      </button>
                      <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center transition-colors active:scale-95"
                      >
                        <FaPlus size={10} />
                      </button>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-gray-500">{item.price.toFixed(2)} × {item.quantity}</p>
                      <p className="font-bold text-blue-600 text-lg">{(item.price * item.quantity).toFixed(2)} د.ع</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* إجماليات الفاتورة */}
        <div className="border-t bg-gray-50 p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-lg">
              <span>المجموع:</span>
              <span>{calculateSubtotal().toFixed(2)} د.ع</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>الضريبة:</span>
              <span>{calculateTax().toFixed(2)} د.ع</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>الإجمالي:</span>
              <span className="text-blue-600">{calculateTotal().toFixed(2)} د.ع</span>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold text-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <FaCreditCard />
            إتمام البيع
          </button>
        </div>
      </div>

      {/* نافذة الدفع */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">إتمام عملية البيع</h3>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {/* طريقة الدفع */}
              <div className="mb-6">
                <label className="block mb-3 font-bold text-lg">طريقة الدفع</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'cash', label: 'نقدي', icon: FaMoneyBill, color: 'green' },
                    { value: 'card', label: 'بطاقة', icon: FaCreditCard, color: 'blue' },
                    { value: 'electronic', label: 'إلكتروني', icon: FaMobileAlt, color: 'purple' }
                  ].map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                          paymentMethod === method.value 
                            ? `border-${method.color}-500 bg-${method.color}-50` 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <IconComponent 
                          className={`mx-auto mb-2 text-${method.color}-500`} 
                          size={24} 
                        />
                        <span className="font-bold">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* المبلغ المدفوع */}
              <div className="mb-4">
                <label className="block mb-2 font-bold text-lg">المبلغ المدفوع</label>
                <input
                  type="text"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg text-2xl font-bold text-center focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
                <Numpad />
              </div>
              
              {/* ملخص الدفع */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span>الإجمالي:</span>
                    <span>{calculateTotal().toFixed(2)} د.ع</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>المدفوع:</span>
                    <span>{parseFloat(paidAmount || 0).toFixed(2)} د.ع</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t pt-3">
                    <span>الباقي:</span>
                    <span className={calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {calculateChange().toFixed(2)} د.ع
                    </span>
                  </div>
                </div>
              </div>
              
              {/* زر التأكيد */}
              <button
                onClick={processPayment}
                disabled={calculateChange() < 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-xl transition-colors duration-200 flex items-center justify-center gap-3"
              >
                <FaPrint />
                تأكيد الدفع وطباعة الإيصال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSScreen;