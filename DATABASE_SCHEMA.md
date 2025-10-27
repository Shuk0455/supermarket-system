"# 🗄️ مخطط قاعدة البيانات - Supermarket Database Schema

## 📊 نظرة عامة

قاعدة البيانات تحتوي على **14 جدول رئيسي** مصممة لإدارة جميع جوانب السوبر ماركت.

---

## 📋 الجداول الرئيسية

### 1. users - المستخدمون
إدارة حسابات المستخدمين والصلاحيات

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| username | String | اسم المستخدم (فريد) |
| email | String | البريد الإلكتروني (فريد) |
| hashed_password | String | كلمة المرور المشفرة |
| full_name | String | الاسم الكامل |
| role | Enum | الصلاحية (admin, manager, cashier) |
| is_active | Boolean | الحساب نشط؟ |
| created_at | DateTime | تاريخ الإنشاء |
| updated_at | DateTime | تاريخ آخر تحديث |

**العلاقات:**
- له عدة `invoices` (فواتير)
- له عدة `shifts` (ورديات)
- له عدة `audit_logs` (سجلات تدقيق)

---

### 2. categories - التصنيفات
تصنيف المنتجات

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| name | String | اسم التصنيف (عربي) |
| name_en | String | اسم التصنيف (إنجليزي) |
| description | Text | الوصف |
| is_active | Boolean | نشط؟ |
| created_at | DateTime | تاريخ الإنشاء |

**العلاقات:**
- له عدة `products` (منتجات)

---

### 3. products - المنتجات
معلومات المنتجات والمخزون

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| barcode | String | الباركود (فريد) |
| name | String | اسم المنتج (عربي) |
| name_en | String | اسم المنتج (إنجليزي) |
| description | Text | الوصف |
| category_id | String | معرف التصنيف |
| cost_price | Decimal(10,2) | سعر التكلفة |
| selling_price | Decimal(10,2) | سعر البيع |
| stock_quantity | Integer | الكمية في المخزون |
| min_stock_level | Integer | الحد الأدنى للمخزون |
| unit | String | الوحدة (piece, kg, liter, box) |
| tax_rate | Decimal(5,2) | نسبة الضريبة (%) |
| image_url | String | رابط الصورة |
| is_active | Boolean | نشط؟ |
| created_at | DateTime | تاريخ الإنشاء |
| updated_at | DateTime | تاريخ آخر تحديث |

**العلاقات:**
- ينتمي لـ `category` (تصنيف)
- له عدة `invoice_items` (عناصر فواتير)
- له عدة `inventory_movements` (حركات مخزون)

**مؤشرات (Indexes):**
- `barcode` (فريد)
- `name`
- `category_id`

---

### 4. product_bundles - رزم المنتجات
حزم المنتجات (عروض)

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| name | String | اسم الرزمة |
| barcode | String | الباركود (فريد) |
| description | Text | الوصف |
| bundle_price | Decimal(10,2) | سعر الرزمة |
| is_active | Boolean | نشط؟ |
| created_at | DateTime | تاريخ الإنشاء |

**العلاقات:**
- يحتوي على عدة `products` (many-to-many)

---

### 5. suppliers - الموردون
معلومات الموردين

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| name | String | اسم المورد |
| contact_person | String | شخص الاتصال |
| phone | String | رقم الهاتف |
| email | String | البريد الإلكتروني |
| address | Text | العنوان |
| is_active | Boolean | نشط؟ |
| created_at | DateTime | تاريخ الإنشاء |

---

### 6. customers - العملاء
معلومات العملاء

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| name | String | اسم العميل |
| phone | String | رقم الهاتف (فريد) |
| email | String | البريد الإلكتروني |
| address | Text | العنوان |
| loyalty_points | Integer | نقاط الولاء |
| is_active | Boolean | نشط؟ |
| created_at | DateTime | تاريخ الإنشاء |

**العلاقات:**
- له عدة `invoices` (فواتير)

**مؤشرات:**
- `phone` (فريد)
- `name`

---

### 7. invoices - الفواتير
فواتير المبيعات والمشتريات

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| invoice_number | String | رقم الفاتورة (فريد) |
| invoice_type | Enum | النوع (sale, purchase, return) |
| user_id | String | معرف المستخدم |
| customer_id | String | معرف العميل |
| shift_id | String | معرف الوردية |
| subtotal | Decimal(10,2) | الإجمالي الفرعي |
| tax_amount | Decimal(10,2) | مبلغ الضريبة |
| discount_amount | Decimal(10,2) | مبلغ الخصم |
| total_amount | Decimal(10,2) | الإجمالي النهائي |
| payment_method | Enum | طريقة الدفع (cash, card, electronic, mixed) |
| paid_amount | Decimal(10,2) | المبلغ المدفوع |
| change_amount | Decimal(10,2) | الباقي |
| notes | Text | ملاحظات |
| is_void | Boolean | ملغاة؟ |
| created_at | DateTime | تاريخ الإنشاء |

**العلاقات:**
- ينتمي لـ `user` (مستخدم)
- ينتمي لـ `customer` (عميل)
- ينتمي لـ `shift` (وردية)
- له عدة `invoice_items` (عناصر)
- له عدة `payments` (مدفوعات)

**مؤشرات:**
- `invoice_number` (فريد)
- `created_at`
- `user_id`
- `customer_id`

---

### 8. invoice_items - عناصر الفواتير
المنتجات في كل فاتورة

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| invoice_id | String | معرف الفاتورة |
| product_id | String | معرف المنتج |
| product_name | String | اسم المنتج |
| quantity | Decimal(10,3) | الكمية |
| unit_price | Decimal(10,2) | سعر الوحدة |
| tax_rate | Decimal(5,2) | نسبة الضريبة |
| discount | Decimal(10,2) | الخصم |
| total_price | Decimal(10,2) | السعر الإجمالي |

**العلاقات:**
- ينتمي لـ `invoice` (فاتورة)
- ينتمي لـ `product` (منتج)

---

### 9. payments - المدفوعات
تفاصيل المدفوعات

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| invoice_id | String | معرف الفاتورة |
| payment_method | Enum | طريقة الدفع |
| amount | Decimal(10,2) | المبلغ |
| reference_number | String | رقم المرجع (للبطاقات) |
| notes | Text | ملاحظات |
| created_at | DateTime | تاريخ الإنشاء |

**العلاقات:**
- ينتمي لـ `invoice` (فاتورة)

---

### 10. shifts - الورديات
ورديات الكاشير

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| user_id | String | معرف المستخدم (الكاشير) |
| status | Enum | الحالة (open, closed) |
| opening_balance | Decimal(10,2) | رصيد الافتتاح |
| closing_balance | Decimal(10,2) | رصيد الإغلاق |
| expected_cash | Decimal(10,2) | النقد المتوقع |
| actual_cash | Decimal(10,2) | النقد الفعلي |
| difference | Decimal(10,2) | الفرق |
| notes | Text | ملاحظات |
| opened_at | DateTime | تاريخ الفتح |
| closed_at | DateTime | تاريخ الإغلاق |

**العلاقات:**
- ينتمي لـ `user` (مستخدم)
- له عدة `invoices` (فواتير)
- له عدة `cash_movements` (حركات نقدية)

---

### 11. cash_register - حركات الصندوق
حركات النقد في الصندوق

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| shift_id | String | معرف الوردية |
| transaction_type | String | نوع الحركة (sale, expense, deposit, withdrawal) |
| amount | Decimal(10,2) | المبلغ |
| description | Text | الوصف |
| created_at | DateTime | تاريخ الإنشاء |

**العلاقات:**
- ينتمي لـ `shift` (وردية)

---

### 12. inventory_movements - حركات المخزون
تتبع حركات المخزون

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| product_id | String | معرف المنتج |
| movement_type | String | نوع الحركة (purchase, sale, adjustment, damage) |
| quantity | Decimal(10,3) | الكمية (+/-) |
| previous_quantity | Decimal(10,3) | الكمية السابقة |
| new_quantity | Decimal(10,3) | الكمية الجديدة |
| notes | Text | ملاحظات |
| created_at | DateTime | تاريخ الإنشاء |

**العلاقات:**
- ينتمي لـ `product` (منتج)

**مؤشرات:**
- `product_id`
- `created_at`

---

### 13. offers - العروض
عروض وخصومات

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| name | String | اسم العرض |
| description | Text | الوصف |
| discount_type | String | نوع الخصم (percentage, fixed) |
| discount_value | Decimal(10,2) | قيمة الخصم |
| min_quantity | Integer | الحد الأدنى للكمية |
| start_date | DateTime | تاريخ البداية |
| end_date | DateTime | تاريخ النهاية |
| is_active | Boolean | نشط؟ |
| created_at | DateTime | تاريخ الإنشاء |

---

### 14. audit_logs - سجل التدقيق
تسجيل جميع العمليات

| Column | Type | Description |
|--------|------|-------------|
| id | String (UUID) | المعرف الفريد |
| user_id | String | معرف المستخدم |
| action | String | الإجراء (create, update, delete, login, logout) |
| entity_type | String | نوع الكيان (product, invoice, user, etc) |
| entity_id | String | معرف الكيان |
| details | Text | التفاصيل (JSON) |
| ip_address | String | عنوان IP |
| created_at | DateTime | تاريخ الإنشاء |

**العلاقات:**
- ينتمي لـ `user` (مستخدم)

**مؤشرات:**
- `user_id`
- `created_at`
- `entity_type`

---

## 🔗 مخطط العلاقات (ERD)

```
┌─────────────┐         ┌──────────────┐
│   users     │◄────────┤   invoices   │
└─────────────┘         └──────────────┘
       │                       │
       │                       │
       ▼                       ▼
┌─────────────┐         ┌──────────────┐
│   shifts    │         │invoice_items │
└─────────────┘         └──────────────┘
       │                       │
       │                       │
       ▼                       ▼
┌─────────────┐         ┌──────────────┐
│cash_register│         │   products   │
└─────────────┘         └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  categories  │
                        └──────────────┘
```

---

## 📊 حجم البيانات المتوقع

### سوبر ماركت صغير (100 منتج):
- Products: ~100 صف
- Invoices: ~50-100 يومياً (1,500-3,000 شهرياً)
- Invoice Items: ~150-300 يومياً
- Users: 5-10
- Customers: 200-500

### سوبر ماركت متوسط (1000 منتج):
- Products: ~1,000 صف
- Invoices: ~200-500 يومياً (6,000-15,000 شهرياً)
- Invoice Items: ~600-1,500 يومياً
- Users: 10-20
- Customers: 1,000-5,000

### سوبر ماركت كبير (5000+ منتج):
- Products: ~5,000-10,000 صف
- Invoices: ~1,000+ يومياً (30,000+ شهرياً)
- Invoice Items: ~3,000+ يومياً
- Users: 20-50
- Customers: 5,000-20,000

---

## 🔒 الأمان

### حماية البيانات:
1. **Passwords**: مشفرة باستخدام bcrypt
2. **JWT Tokens**: للمصادقة
3. **SQL Injection**: محمي عبر SQLAlchemy ORM
4. **Audit Logs**: تسجيل جميع العمليات الحساسة

### النسخ الاحتياطي:
```bash
# يومي
pg_dump supermarket_db > backup_$(date +%Y%m%d).sql

# أسبوعي (كامل)
pg_dumpall > full_backup_$(date +%Y%m%d).sql
```

---

## 📈 التحسينات والمؤشرات

### مؤشرات موصى بها:
```sql
-- Products
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);

-- Invoices
CREATE INDEX idx_invoices_date ON invoices(created_at);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Inventory Movements
CREATE INDEX idx_inventory_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_date ON inventory_movements(created_at);

-- Audit Logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

---

## 🔧 الصيانة

### تنظيف دوري:
```sql
-- حذف سجلات التدقيق القديمة (أكثر من سنة)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';

-- تنظيف الجداول
VACUUM ANALYZE;

-- إعادة بناء المؤشرات
REINDEX DATABASE supermarket_db;
```

### التحقق من الأداء:
```sql
-- أبطأ الاستعلامات
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- حجم الجداول
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📝 ملاحظات مهمة

1. **UUID vs Auto-increment**: استخدمنا UUID للمعرفات لتجنب التعارضات في حالة دمج البيانات من عدة فروع

2. **Decimal vs Float**: استخدمنا Decimal للأموال لتجنب أخطاء التقريب

3. **Soft Delete**: بعض الجداول تستخدم `is_active` بدلاً من الحذف الفعلي

4. **Timestamps**: جميع الجداول تحتوي على `created_at` على الأقل

5. **Indexing**: المؤشرات مهمة جداً للأداء، خاصة على الأعمدة المستخدمة في البحث

---

## 🚀 الترقيات المستقبلية

### قاعدة بيانات:
- [ ] جدول `branches` (فروع متعددة)
- [ ] جدول `promotions` (ترويج متقدم)
- [ ] جدول `purchase_orders` (طلبات شراء)
- [ ] جدول `stock_takes` (جرد)
- [ ] جدول `returns` (مرتجعات منفصلة)

### تحسينات الأداء:
- [ ] Partitioning للجداول الكبيرة (invoices, invoice_items)
- [ ] Read Replicas للتقارير
- [ ] Caching Layer (Redis)

---

**تم التصميم بعناية لضمان الأداء والمرونة والقابلية للتطوير 🎯**
"