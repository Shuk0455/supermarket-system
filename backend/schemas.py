from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from models import UserRole, InvoiceType, PaymentMethod, ShiftStatus

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class Category(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime

# Product Schemas
class ProductBase(BaseModel):
    barcode: str
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    selling_price: Decimal = Field(ge=0)
    stock_quantity: int = 0
    min_stock_level: int = 10
    unit: str = "piece"
    tax_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    image_url: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    barcode: Optional[str] = None
    name: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    cost_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    unit: Optional[str] = None
    tax_rate: Optional[Decimal] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class Product(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
    category: Optional[Category] = None

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    loyalty_points: int = 0
    is_active: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    loyalty_points: Optional[int] = None
    is_active: Optional[bool] = None

class Customer(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime

# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class Supplier(SupplierBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime

# Invoice Item Schemas
class InvoiceItemBase(BaseModel):
    product_id: str
    product_name: str
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    tax_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0)
    total_price: Decimal = Field(ge=0)

class InvoiceItemCreate(BaseModel):
    product_id: str
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    tax_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0)

class InvoiceItem(InvoiceItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    invoice_id: str

# Invoice Schemas
class InvoiceBase(BaseModel):
    invoice_type: InvoiceType = InvoiceType.SALE
    customer_id: Optional[str] = None
    payment_method: PaymentMethod
    notes: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]
    paid_amount: Decimal = Field(ge=0)
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)

class Invoice(InvoiceBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    invoice_number: str
    user_id: str
    shift_id: Optional[str] = None
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    change_amount: Decimal
    is_void: bool
    created_at: datetime
    items: List[InvoiceItem] = []
    user: Optional[User] = None
    customer: Optional[Customer] = None

# Shift Schemas
class ShiftOpen(BaseModel):
    opening_balance: Decimal = Field(default=Decimal("0.00"), ge=0)
    notes: Optional[str] = None

class ShiftClose(BaseModel):
    actual_cash: Decimal = Field(ge=0)
    notes: Optional[str] = None

class Shift(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    status: ShiftStatus
    opening_balance: Decimal
    closing_balance: Optional[Decimal] = None
    expected_cash: Optional[Decimal] = None
    actual_cash: Optional[Decimal] = None
    difference: Optional[Decimal] = None
    notes: Optional[str] = None
    opened_at: datetime
    closed_at: Optional[datetime] = None
    user: Optional[User] = None

# Inventory Movement Schemas
class InventoryMovementBase(BaseModel):
    product_id: str
    movement_type: str
    quantity: Decimal
    notes: Optional[str] = None

class InventoryMovementCreate(InventoryMovementBase):
    pass

class InventoryMovement(InventoryMovementBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    previous_quantity: Decimal
    new_quantity: Decimal
    created_at: datetime

# Offer Schemas
class OfferBase(BaseModel):
    name: str
    description: Optional[str] = None
    discount_type: str
    discount_value: Decimal = Field(ge=0)
    min_quantity: int = 1
    start_date: datetime
    end_date: datetime
    is_active: bool = True

class OfferCreate(OfferBase):
    pass

class OfferUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    min_quantity: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class Offer(OfferBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime

# Statistics and Reports
class DashboardStats(BaseModel):
    total_sales_today: Decimal
    total_invoices_today: int
    total_products: int
    low_stock_products: int
    active_shifts: int

class SalesReport(BaseModel):
    date: str
    total_sales: Decimal
    total_invoices: int
    cash_sales: Decimal
    card_sales: Decimal
    electronic_sales: Decimal

class ProductSalesReport(BaseModel):
    product_id: str
    product_name: str
    barcode: str
    quantity_sold: Decimal
    total_revenue: Decimal
    total_profit: Decimal
