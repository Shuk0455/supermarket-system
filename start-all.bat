@echo off
echo ========================================
echo Starting All Services
echo ========================================

start "Backend API" cmd /k "cd backend && venv\Scripts\activate && python server.py"
timeout /t 5 /nobreak > nul

start "Admin App" cmd /k "cd admin-app && yarn start"
timeout /t 3 /nobreak > nul

start "POS App" cmd /k "cd pos-app && yarn start"

echo.
echo All services are starting...
echo.
echo Backend API: http://localhost:8000
echo Admin App: http://localhost:3000
echo POS App: http://localhost:3001
echo.
pause
