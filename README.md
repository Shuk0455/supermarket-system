"# 🛒 نظام إدارة السوبر ماركت المتكامل
## Supermarket Management System

نظام متكامل لإدارة السوبر ماركت يتكون من ثلاثة أجزاء رئيسية:
1. **Backend API** (FastAPI + PostgreSQL)
2. **Admin App** (Electron + React) - برنامج الإدارة
3. **POS App** (Electron + React) - نقطة البيع

---

## 📋 المتطلبات الأساسية

### Windows Requirements:
- **Python 3.10+**
- **Node.js 18+** و **Yarn**
- **PostgreSQL 14+**
- **Git** (اختياري)

### تثبيت المتطلبات:

#### 1. تثبيت Python
- حمل Python من: https://www.python.org/downloads/
- تأكد من تحديد \"Add Python to PATH\" أثناء التثبيت

#### 2. تثبيت Node.js & Yarn
```bash
# حمل Node.js من: https://nodejs.org/
# بعد التثبيت، ثبت Yarn:
npm install -g yarn
```

#### 3. تثبيت PostgreSQL
- حمل PostgreSQL من: https://www.postgresql.org/download/windows/
- أنشئ قاعدة بيانات جديدة:
```sql
CREATE DATABASE supermarket_db;
CREATE USER supermarket_user WITH PASSWORD 'supermarket_pass';
GRANT ALL PRIVILEGES ON DATABASE supermarket_db TO supermarket_user;
```

---

## 🚀 خطوات التشغيل

### الخطوة 1: إعداد Backend API

```bash
cd backend

# إنشاء بيئة افتراضية
python -m venv venv

# تفعيل البيئة الافتراضية (Windows)
venv\Scripts\activate

# تثبيت المكتبات
pip install -r requirements.txt

# تعديل ملف .env حسب إعدادات قاعدة البيانات
# DATABASE_URL=postgresql://supermarket_user:supermarket_pass@localhost:5432/supermarket_db

# تشغيل السيرفر
python server.py
```

السيرفر سيعمل على: `http://localhost:8000`  
الـ API Docs: `http://localhost:8000/docs`

**الحساب الافتراضي:**
- Username: `admin`
- Password: `admin123`

---

### الخطوة 2: تشغيل Admin App (Development Mode)

```bash
cd admin-app

# تثبيت المكتبات
yarn install

# تشغيل التطبيق
yarn start
```

التطبيق سيفتح على: `http://localhost:3000`

#### بناء تطبيق Windows (.exe)
```bash
# بناء React App
yarn build

# بناء Electron App
yarn electron-pack
```

سيتم إنشاء ملف `.exe` في مجلد `dist/`

---

### الخطوة 3: تشغيل POS App (Development Mode)

```bash
cd pos-app

# تثبيت المكتبات
yarn install

# تشغيل التطبيق
yarn start
```

التطبيق سيفتح على: `http://localhost:3001`

#### بناء تطبيق Windows (.exe)
```bash
# بناء React App
yarn build

# بناء Electron App
yarn electron-pack
```

سيتم إنشاء ملف `.exe` في مجلد `dist/`

---

## 🎯 الميزات المنفذة

### ✅ Backend API
- نظام مصادقة JWT
- إدارة المستخدمين والصلاحيات (Admin, Manager, Cashier)
- إدارة المنتجات والتصنيفات
- إدارة المخزون مع تتبع الحركات التلقائي
- إدارة العملاء والموردين
- نظام فواتير متكامل (مبيعات، مشتريات، مرتجعات)
- نظام الورديات للكاشير
- لوحة تحكم وإحصائيات
- تقارير مبيعات ومخزون
- سجل تدقيق (Audit Log)

### ✅ Admin App
- تسجيل دخول آمن
- لوحة تحكم بالإحصائيات
- إدارة المنتجات (إضافة، تعديل، حذف، بحث)
- إدارة التصنيفات
- إدارة المستخدمين والصلاحيات
- إدارة العملاء والموردين
- عرض وتصفح الفواتير
- تقارير المبيعات والمخزون
- تنبيهات المخزون المنخفض

### ✅ POS App
- تسجيل دخول سريع للكاشير
- إدارة الورديات (فتح/إغلاق)
- واجهة بيع سريعة وسهلة الاستخدام
- دعم البحث بالباركود
- سلة تسوق تفاعلية
- حساب الضرائب التلقائي
- طرق دفع متعددة (نقدي، بطاقة، إلكتروني)
- حساب الباقي التلقائي
- لوحة أرقام (Number Pad) مدمجة
- تحديث المخزون التلقائي

---

## 📊 قاعدة البيانات

### الجداول الرئيسية:
1. **users** - المستخدمون
2. **categories** - التصنيفات
3. **products** - المنتجات
4. **product_bundles** - الرزم/الحزم
5. **suppliers** - الموردون
6. **customers** - العملاء
7. **invoices** - الفواتير
8. **invoice_items** - عناصر الفواتير
9. **payments** - المدفوعات
10. **shifts** - الورديات
11. **cash_register** - حركات الصندوق
12. **inventory_movements** - حركات المخزون
13. **offers** - العروض
14. **audit_logs** - سجل التدقيق

---

## 🔐 الصلاحيات والأدوار

### Admin (مدير النظام)
- الوصول الكامل لجميع الميزات
- إدارة المستخدمين والصلاحيات
- عرض وتعديل جميع البيانات

### Manager (مدير)
- إدارة المنتجات والمخزون
- إدارة الفواتير والمبيعات
- عرض التقارير والإحصائيات
- إدارة العملاء والموردين

### Cashier (كاشير)
- الوصول إلى POS فقط
- إنشاء فواتير مبيعات
- إدارة الورديات
- عرض لوحة التحكم الأساسية

---

## 🔧 التكوين والإعدادات

### Backend (.env)
```env
DATABASE_URL=postgresql://supermarket_user:supermarket_pass@localhost:5432/supermarket_db
SECRET_KEY=your-secret-key-change-in-production-min-32-chars-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=*
```

### Admin App (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api
```

### POS App (.env)
```env
PORT=3001
REACT_APP_API_URL=http://localhost:8000/api
```

---

## 📱 واجهات المستخدم

### Admin App
- واجهة احترافية باللغة العربية
- Sidebar للتنقل السريع
- جداول تفاعلية لعرض البيانات
- نماذج (Modals) لإضافة وتعديل البيانات
- إشعارات (Toasts) للعمليات
- تصميم متجاوب (Responsive)

### POS App
- واجهة بسيطة ومريحة للكاشير
- شاشة مقسمة (المنتجات + السلة)
- لوحة أرقام مدمجة
- دعم لمسة واحدة للإضافة
- ألوان واضحة ومتباينة

---

## 🖨️ الطباعة (قيد التطوير)

تم إعداد البنية الأساسية لطباعة الإيصالات باستخدام `electron-pos-printer`.

### للتفعيل:
1. قم بتوصيل طابعة حرارية
2. عدل دالة `printReceipt()` في `pos-app/src/pages/POSScreen.js`
3. استخدم المكتبة لإرسال البيانات للطابعة

---

## 💳 الدفع الإلكتروني (قيد التطوير)

يمكن دمج بوابات الدفع الإلكترونية مثل:
- Stripe
- PayPal
- بوابات دفع محلية

---

## 🧪 الاختبار

### Backend API Testing:
```bash
# باستخدام pytest
cd backend
pytest
```

### Frontend Testing:
```bash
# باستخدام React Testing Library
cd admin-app
yarn test
```

---

## 📦 البناء للإنتاج (Production Build)

### Backend
```bash
cd backend
# استخدم Gunicorn أو Uvicorn مع systemd
gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Admin App
```bash
cd admin-app
yarn build
yarn electron-pack

# الملف سيكون في: dist/Supermarket Admin Setup.exe
```

### POS App
```bash
cd pos-app
yarn build
yarn electron-pack

# الملف سيكون في: dist/Supermarket POS Setup.exe
```

---

## 🐛 حل المشاكل الشائعة

### 1. فشل الاتصال بقاعدة البيانات
- تأكد من تشغيل PostgreSQL
- تحقق من صحة بيانات الاتصال في `.env`
- تأكد من إنشاء قاعدة البيانات والمستخدم

### 2. فشل تثبيت المكتبات
```bash
# نظف الـ cache
yarn cache clean
npm cache clean --force

# أعد التثبيت
yarn install
```

### 3. مشكلة CORS
- تأكد من ضبط `CORS_ORIGINS` في backend/.env
- أعد تشغيل Backend API

### 4. Electron لا يفتح
- تأكد من تثبيت جميع dependencies
- جرب حذف `node_modules` وإعادة التثبيت

---

## 📚 الموارد والوثائق

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **Electron Docs**: https://www.electronjs.org/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## 🔄 التحديثات المستقبلية

### المرحلة 2 (التطويرات المخططة):
- ✅ تكامل الطابعات الحرارية
- ✅ تكامل قارئ الباركود
- ✅ تكامل درج النقود
- ✅ تكامل بوابات الدفع الإلكتروني
- ✅ نظام العروض والخصومات المتقدم
- ✅ تقارير محاسبية تفصيلية
- ✅ نظام النسخ الاحتياطي التلقائي
- ✅ تطبيق الهاتف المحمول (Android/iOS)
- ✅ نظام الولاء للعملاء
- ✅ لوحة تحكم تحليلية متقدمة
- ✅ دعم عدة فروع

---

## 👨‍💻 المطور

تم تطوير هذا النظام باستخدام أحدث تقنيات البرمجة:
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React 19, Tailwind CSS, Radix UI
- **Desktop**: Electron 34
- **Architecture**: REST API, JWT Authentication, MVC Pattern

---

## 📄 الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الشخصي والتجاري.

---

## 📞 الدعم

لأي استفسارات أو مشاكل، يرجى فتح Issue على GitHub أو التواصل مباشرة.

---

## 🎉 شكراً

شكراً لاستخدامك نظام إدارة السوبر ماركت المتكامل!

نتمنى لك تجربة ممتازة 🚀

---

**Built with ❤️ using FastAPI, React, and Electron**
"# supermarket-system
# supermarket-system
