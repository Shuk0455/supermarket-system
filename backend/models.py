from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum, Table, Numeric
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone
import enum
import uuid

# Enums
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    CASHIER = "cashier"

class InvoiceType(str, enum.Enum):
    SALE = "sale"
    PURCHASE = "purchase"
    RETURN = "return"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    ELECTRONIC = "electronic"
    MIXED = "mixed"

class ShiftStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"

# Association table for product bundles
product_bundle_items = Table(
    'product_bundle_items',
    Base.metadata,
    Column('bundle_id', String, ForeignKey('product_bundles.id')),
    Column('product_id', String, ForeignKey('products.id')),
    Column('quantity', Integer, default=1)
)

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.CASHIER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    invoices = relationship("Invoice", back_populates="user")
    shifts = relationship("Shift", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True, index=True)
    name_en = Column(String)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    barcode = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    name_en = Column(String)
    description = Column(Text)
    category_id = Column(String, ForeignKey("categories.id"))
    cost_price = Column(Numeric(10, 2), nullable=False, default=0)
    selling_price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=10)
    unit = Column(String, default="piece")  # piece, kg, liter, etc
    tax_rate = Column(Numeric(5, 2), default=0)  # percentage
    image_url = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    category = relationship("Category", back_populates="products")
    invoice_items = relationship("InvoiceItem", back_populates="product")
    inventory_movements = relationship("InventoryMovement", back_populates="product")

class ProductBundle(Base):
    __tablename__ = "product_bundles"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    barcode = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text)
    bundle_price = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    products = relationship("Product", secondary=product_bundle_items)

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    contact_person = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    phone = Column(String, unique=True, index=True)
    email = Column(String)
    address = Column(Text)
    loyalty_points = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    invoices = relationship("Invoice", back_populates="customer")

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_number = Column(String, unique=True, nullable=False, index=True)
    invoice_type = Column(SQLEnum(InvoiceType), nullable=False, default=InvoiceType.SALE)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"))
    shift_id = Column(String, ForeignKey("shifts.id"))
    subtotal = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    paid_amount = Column(Numeric(10, 2), nullable=False)
    change_amount = Column(Numeric(10, 2), default=0)
    notes = Column(Text)
    is_void = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    user = relationship("User", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    shift = relationship("Shift", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Numeric(10, 3), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0)
    discount = Column(Numeric(10, 2), default=0)
    total_price = Column(Numeric(10, 2), nullable=False)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product", back_populates="invoice_items")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    reference_number = Column(String)  # for card/electronic payments
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    invoice = relationship("Invoice", back_populates="payments")

class Shift(Base):
    __tablename__ = "shifts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(ShiftStatus), nullable=False, default=ShiftStatus.OPEN)
    opening_balance = Column(Numeric(10, 2), nullable=False, default=0)
    closing_balance = Column(Numeric(10, 2))
    expected_cash = Column(Numeric(10, 2))
    actual_cash = Column(Numeric(10, 2))
    difference = Column(Numeric(10, 2))
    notes = Column(Text)
    opened_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="shifts")
    invoices = relationship("Invoice", back_populates="shift")
    cash_movements = relationship("CashRegister", back_populates="shift")

class CashRegister(Base):
    __tablename__ = "cash_register"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    shift_id = Column(String, ForeignKey("shifts.id"), nullable=False)
    transaction_type = Column(String, nullable=False)  # sale, expense, deposit, withdrawal
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    shift = relationship("Shift", back_populates="cash_movements")

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    movement_type = Column(String, nullable=False)  # purchase, sale, adjustment, damage
    quantity = Column(Numeric(10, 3), nullable=False)
    previous_quantity = Column(Numeric(10, 3), nullable=False)
    new_quantity = Column(Numeric(10, 3), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    product = relationship("Product", back_populates="inventory_movements")

class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    discount_type = Column(String, nullable=False)  # percentage, fixed
    discount_value = Column(Numeric(10, 2), nullable=False)
    min_quantity = Column(Integer, default=1)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # create, update, delete, login, logout
    entity_type = Column(String, nullable=False)  # product, invoice, user, etc
    entity_id = Column(String)
    details = Column(Text)  # JSON string with details
    ip_address = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
