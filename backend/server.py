from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import os
from dotenv import load_dotenv

from database import engine, get_db, Base
from models import User, Category, Product, Customer, Supplier, Invoice, InvoiceItem, Shift, InventoryMovement, Offer, AuditLog, UserRole, InvoiceType, ShiftStatus, PaymentMethod
import schemas
from auth import get_password_hash, verify_password, create_access_token, get_current_active_user

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Supermarket Management System API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database with default admin user
def init_db():
    db = next(get_db())
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@supermarket.com",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("✅ Default admin user created: username=admin, password=admin123")

init_db()

# ============= AUTH ROUTES =============
@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_login: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_login.username).first()
    if not user or not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is disabled")
    
    access_token = create_access_token(data={"sub": user.username})
    
    # Create audit log
    audit_log = AuditLog(
        user_id=user.id,
        action="login",
        entity_type="auth",
        details="User logged in successfully"
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=schemas.User)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# ============= USER ROUTES =============
@app.post("/api/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing_user = db.query(User).filter((User.username == user.username) | (User.email == user.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/users", response_model=List[schemas.User])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@app.get("/api/users/{user_id}", response_model=schemas.User)
def get_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/users/{user_id}", response_model=schemas.User)
def update_user(user_id: str, user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.email:
        user.email = user_update.email
    if user_update.full_name:
        user.full_name = user_update.full_name
    if user_update.role:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.password:
        user.hashed_password = get_password_hash(user_update.password)
    
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# ============= CATEGORY ROUTES =============
@app.post("/api/categories", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.get("/api/categories", response_model=List[schemas.Category])
def get_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.is_active == True).offset(skip).limit(limit).all()
    return categories

@app.get("/api/categories/{category_id}", response_model=schemas.Category)
def get_category(category_id: str, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.put("/api/categories/{category_id}", response_model=schemas.Category)
def update_category(category_id: str, category_update: schemas.CategoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in category_update.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    
    db.commit()
    db.refresh(category)
    return category

@app.delete("/api/categories/{category_id}")
def delete_category(category_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.is_active = False
    db.commit()
    return {"message": "Category deleted successfully"}

# ============= PRODUCT ROUTES =============
@app.post("/api/products", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    existing_product = db.query(Product).filter(Product.barcode == product.barcode).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this barcode already exists")
    
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/api/products", response_model=List[schemas.Product])
def get_products(skip: int = 0, limit: int = 100, search: Optional[str] = None, category_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Product).filter(Product.is_active == True)
    
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.barcode.ilike(f"%{search}%"))
        )
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    products = query.offset(skip).limit(limit).all()
    return products

@app.get("/api/products/barcode/{barcode}", response_model=schemas.Product)
def get_product_by_barcode(barcode: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.barcode == barcode, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/api/products/{product_id}", response_model=schemas.Product)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.put("/api/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: str, product_update: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_update.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return product

@app.delete("/api/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.is_active = False
    db.commit()
    return {"message": "Product deleted successfully"}

# ============= CUSTOMER ROUTES =============
@app.post("/api/customers", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    existing_customer = db.query(Customer).filter(Customer.phone == customer.phone).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="Customer with this phone already exists")
    
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get("/api/customers", response_model=List[schemas.Customer])
def get_customers(skip: int = 0, limit: int = 100, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Customer).filter(Customer.is_active == True)
    
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) |
            (Customer.phone.ilike(f"%{search}%"))
        )
    
    customers = query.offset(skip).limit(limit).all()
    return customers

@app.get("/api/customers/{customer_id}", response_model=schemas.Customer)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.put("/api/customers/{customer_id}", response_model=schemas.Customer)
def update_customer(customer_id: str, customer_update: schemas.CustomerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in customer_update.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return customer

# ============= SUPPLIER ROUTES =============
@app.post("/api/suppliers", response_model=schemas.Supplier)
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@app.get("/api/suppliers", response_model=List[schemas.Supplier])
def get_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).filter(Supplier.is_active == True).offset(skip).limit(limit).all()
    return suppliers

# ============= INVOICE ROUTES =============
@app.post("/api/invoices", response_model=schemas.Invoice)
def create_invoice(invoice_data: schemas.InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Get current active shift
    current_shift = db.query(Shift).filter(
        Shift.user_id == current_user.id,
        Shift.status == ShiftStatus.OPEN
    ).first()
    
    # Calculate totals
    subtotal = Decimal("0.00")
    tax_amount = Decimal("0.00")
    
    for item in invoice_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        if product.stock_quantity < float(item.quantity):
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
        
        item_total = item.unit_price * item.quantity
        item_tax = (item_total * item.tax_rate) / Decimal("100")
        item_total_with_tax = item_total + item_tax - item.discount
        
        subtotal += item_total
        tax_amount += item_tax
    
    total_amount = subtotal + tax_amount - invoice_data.discount_amount
    change_amount = invoice_data.paid_amount - total_amount
    
    # Generate invoice number
    today = datetime.now(timezone.utc)
    invoice_count = db.query(Invoice).filter(
        Invoice.created_at >= datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    ).count()
    invoice_number = f"INV-{today.strftime('%Y%m%d')}-{invoice_count + 1:04d}"
    
    # Create invoice
    db_invoice = Invoice(
        invoice_number=invoice_number,
        invoice_type=invoice_data.invoice_type,
        user_id=current_user.id,
        customer_id=invoice_data.customer_id,
        shift_id=current_shift.id if current_shift else None,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=invoice_data.discount_amount,
        total_amount=total_amount,
        payment_method=invoice_data.payment_method,
        paid_amount=invoice_data.paid_amount,
        change_amount=change_amount,
        notes=invoice_data.notes
    )
    db.add(db_invoice)
    db.flush()
    
    # Create invoice items and update inventory
    for item in invoice_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        
        item_total = item.unit_price * item.quantity
        item_tax = (item_total * item.tax_rate) / Decimal("100")
        item_total_price = item_total + item_tax - item.discount
        
        db_item = InvoiceItem(
            invoice_id=db_invoice.id,
            product_id=product.id,
            product_name=product.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            tax_rate=item.tax_rate,
            discount=item.discount,
            total_price=item_total_price
        )
        db.add(db_item)
        
        # Update inventory
        previous_quantity = product.stock_quantity
        product.stock_quantity -= int(float(item.quantity))
        
        inventory_movement = InventoryMovement(
            product_id=product.id,
            movement_type="sale",
            quantity=-item.quantity,
            previous_quantity=Decimal(str(previous_quantity)),
            new_quantity=Decimal(str(product.stock_quantity)),
            notes=f"Sale invoice {invoice_number}"
        )
        db.add(inventory_movement)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@app.get("/api/invoices", response_model=List[schemas.Invoice])
def get_invoices(
    skip: int = 0,
    limit: int = 100,
    invoice_type: Optional[InvoiceType] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Invoice).filter(Invoice.is_void == False)
    
    if invoice_type:
        query = query.filter(Invoice.invoice_type == invoice_type)
    
    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.filter(Invoice.created_at >= start)
    
    if end_date:
        end = datetime.fromisoformat(end_date)
        query = query.filter(Invoice.created_at <= end)
    
    invoices = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()
    return invoices

@app.get("/api/invoices/{invoice_id}", response_model=schemas.Invoice)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

# ============= SHIFT ROUTES =============
@app.post("/api/shifts/open", response_model=schemas.Shift)
def open_shift(shift_data: schemas.ShiftOpen, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Check if user has open shift
    open_shift = db.query(Shift).filter(
        Shift.user_id == current_user.id,
        Shift.status == ShiftStatus.OPEN
    ).first()
    
    if open_shift:
        raise HTTPException(status_code=400, detail="User already has an open shift")
    
    db_shift = Shift(
        user_id=current_user.id,
        status=ShiftStatus.OPEN,
        opening_balance=shift_data.opening_balance,
        notes=shift_data.notes
    )
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift

@app.post("/api/shifts/{shift_id}/close", response_model=schemas.Shift)
def close_shift(shift_id: str, shift_close: schemas.ShiftClose, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    shift = db.query(Shift).filter(Shift.id == shift_id, Shift.user_id == current_user.id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    if shift.status == ShiftStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Shift already closed")
    
    # Calculate expected cash
    cash_sales = db.query(Invoice).filter(
        Invoice.shift_id == shift_id,
        Invoice.payment_method == PaymentMethod.CASH,
        Invoice.is_void == False
    ).all()
    
    expected_cash = shift.opening_balance + sum([sale.total_amount for sale in cash_sales])
    
    shift.status = ShiftStatus.CLOSED
    shift.expected_cash = expected_cash
    shift.actual_cash = shift_close.actual_cash
    shift.difference = shift_close.actual_cash - expected_cash
    shift.closing_balance = shift_close.actual_cash
    shift.closed_at = datetime.now(timezone.utc)
    if shift_close.notes:
        shift.notes = shift_close.notes
    
    db.commit()
    db.refresh(shift)
    return shift

@app.get("/api/shifts/current", response_model=schemas.Shift)
def get_current_shift(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    shift = db.query(Shift).filter(
        Shift.user_id == current_user.id,
        Shift.status == ShiftStatus.OPEN
    ).first()
    
    if not shift:
        raise HTTPException(status_code=404, detail="No active shift found")
    
    return shift

@app.get("/api/shifts", response_model=List[schemas.Shift])
def get_shifts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    shifts = db.query(Shift).order_by(Shift.opened_at.desc()).offset(skip).limit(limit).all()
    return shifts

# ============= DASHBOARD & REPORTS =============
@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    today = datetime.now(timezone.utc)
    today_start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    
    # Total sales today
    today_invoices = db.query(Invoice).filter(
        Invoice.created_at >= today_start,
        Invoice.invoice_type == InvoiceType.SALE,
        Invoice.is_void == False
    ).all()
    
    total_sales_today = sum([inv.total_amount for inv in today_invoices])
    total_invoices_today = len(today_invoices)
    
    # Total products
    total_products = db.query(Product).filter(Product.is_active == True).count()
    
    # Low stock products
    low_stock_products = db.query(Product).filter(
        Product.is_active == True,
        Product.stock_quantity <= Product.min_stock_level
    ).count()
    
    # Active shifts
    active_shifts = db.query(Shift).filter(Shift.status == ShiftStatus.OPEN).count()
    
    return {
        "total_sales_today": total_sales_today,
        "total_invoices_today": total_invoices_today,
        "total_products": total_products,
        "low_stock_products": low_stock_products,
        "active_shifts": active_shifts
    }

@app.get("/api/reports/sales")
def get_sales_report(
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    invoices = db.query(Invoice).filter(
        Invoice.created_at >= start,
        Invoice.created_at <= end,
        Invoice.invoice_type == InvoiceType.SALE,
        Invoice.is_void == False
    ).all()
    
    total_sales = sum([inv.total_amount for inv in invoices])
    cash_sales = sum([inv.total_amount for inv in invoices if inv.payment_method == PaymentMethod.CASH])
    card_sales = sum([inv.total_amount for inv in invoices if inv.payment_method == PaymentMethod.CARD])
    electronic_sales = sum([inv.total_amount for inv in invoices if inv.payment_method == PaymentMethod.ELECTRONIC])
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_sales": total_sales,
        "total_invoices": len(invoices),
        "cash_sales": cash_sales,
        "card_sales": card_sales,
        "electronic_sales": electronic_sales
    }

@app.get("/api/reports/products/low-stock", response_model=List[schemas.Product])
def get_low_stock_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    products = db.query(Product).filter(
        Product.is_active == True,
        Product.stock_quantity <= Product.min_stock_level
    ).all()
    return products

@app.get("/api/inventory/movements", response_model=List[schemas.InventoryMovement])
def get_inventory_movements(
    product_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(InventoryMovement)
    
    if product_id:
        query = query.filter(InventoryMovement.product_id == product_id)
    
    movements = query.order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()
    return movements

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Supermarket Management System API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)