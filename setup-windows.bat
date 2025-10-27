@echo off
echo ========================================
echo Supermarket Management System Setup
echo ========================================
echo.

echo [1/4] Setting up Backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
echo Activating virtual environment...
call venv\Scripts\activate
echo Installing Python dependencies...
pip install -r requirements.txt
cd ..

echo.
echo [2/4] Setting up Admin App...
cd admin-app
echo Installing Node dependencies...
call yarn install
cd ..

echo.
echo [3/4] Setting up POS App...
cd pos-app
echo Installing Node dependencies...
call yarn install
cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is running
echo 2. Create database: supermarket_db
echo 3. Update backend/.env with your database credentials
echo 4. Run start-all.bat to start all services
echo.
pause
