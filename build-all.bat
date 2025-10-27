@echo off
echo ========================================
echo Building Electron Apps
echo ========================================

echo [1/2] Building Admin App...
cd admin-app
call yarn build
call yarn electron-pack
cd ..

echo.
echo [2/2] Building POS App...
cd pos-app
call yarn build
call yarn electron-pack
cd ..

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Admin App: admin-app/dist/
echo POS App: pos-app/dist/
echo.
pause
