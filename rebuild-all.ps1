# ============================================
# rebuild-all.ps1
# يعيد بناء admin-app و pos-app ويُنشئ dist/
# يدعم yarn أو npm تلقائيًا
# ============================================

$ErrorActionPreference = "Stop"

# 0) إعداد المسارات
$ROOT   = "C:\app\supermarket-system"
$APPS   = @("$ROOT\admin-app", "$ROOT\pos-app")

# 1) دوال مساعدة
function Test-Cmd($name) {
    $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

function Get-PkgMgr($appPath) {
    $hasYarnLock = Test-Path (Join-Path $appPath "yarn.lock")
    $hasYarnCmd = Test-Cmd "yarn"
    
    if ($hasYarnLock -and $hasYarnCmd) { return "yarn" }
    if (Test-Cmd "yarn") { return "yarn" }
    return "npm"
}

function Ensure-ElectronMain($appPath) {
    $public = Join-Path $appPath "public"
    New-Item -ItemType Directory -Force -Path $public | Out-Null
    $electronJs = Join-Path $public "electron.js"
    if (-not (Test-Path $electronJs)) {
@'
// Electron main for packaged app (react-cra preset copies to build/electron.js)
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow () {
  const win = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: { 
        contextIsolation: true,
        nodeIntegration: false,
        enableRemoteModule: false
    }
  });
  const indexPath = path.join(__dirname, "index.html");
  win.loadURL(`file://${indexPath}`);
  // win.webContents.openDevTools(); // enable if needed
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
'@ | Set-Content -Encoding utf8 $electronJs
    }
}

function Patch-PackageJson($appPath) {
    $pkgPath = Join-Path $appPath "package.json"
    if (-not (Test-Path $pkgPath)) { throw "package.json not found in $appPath" }
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json

    # main -> build/electron.js (متوافق مع preset react-cra)
    $pkg.main = "build/electron.js"

    # homepage -> "."
    if ($pkg.PSObject.Properties.Name -notcontains 'homepage') {
        $pkg | Add-Member -NotePropertyName homepage -NotePropertyValue "." -Force
    } else { 
        $pkg.homepage = "." 
    }

    # author (لتقليل التحذيرات)
    if ($pkg.PSObject.Properties.Name -notcontains 'author' -or [string]::IsNullOrWhiteSpace($pkg.author)) {
        $pkg | Add-Member -NotePropertyName author -NotePropertyValue "Supermarket System" -Force
    }

    # اكتب التغييرات
    $pkg | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 $pkgPath
}

function Switch-To-HashRouter($appPath) {
    $appJs = Join-Path $appPath "src\App.js"
    if (-not (Test-Path $appJs)) { 
        Write-Host "App.js not found in $appPath" -ForegroundColor Yellow
        return 
    }
    
    $c = Get-Content $appJs -Raw -Encoding UTF8
    
    # استبدال أكثر قوة لـ BrowserRouter بـ HashRouter
    $c = $c -replace "import\s*\{[^}]*\bBrowserRouter\b[^}]*\}", "import { HashRouter as BrowserRouter }"
    $c = $c -replace "<\s*BrowserRouter\s*>", "<BrowserRouter>"
    $c = $c -replace "</\s*BrowserRouter\s*>", "</BrowserRouter>"
    
    Set-Content $appJs $c -Encoding UTF8
    Write-Host "✓ Updated Router in $appPath" -ForegroundColor Green
}

function Ensure-Pos-CSS($appPath) {
    if ($appPath -notlike "*pos-app") { return }
    
    $srcPath = Join-Path $appPath "src"
    if (-not (Test-Path $srcPath)) { 
        New-Item -ItemType Directory -Force -Path $srcPath | Out-Null
    }
    
    $cssPath = Join-Path $srcPath "index.css"
    if (-not (Test-Path $cssPath)) {
@'
@tailwind base;
@tailwind components;
@tailwind utilities;

.product-card { 
    @apply cursor-pointer border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 bg-white;
}
.cart-item { 
    @apply border border-gray-200 rounded-lg p-3 bg-gray-50 hover:shadow-sm transition-shadow;
}
.numpad-btn { 
    @apply py-3 rounded-lg font-bold bg-gray-100 hover:bg-gray-200 text-lg transition-colors duration-200;
}
.modal-overlay { 
    @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}
.modal-content { 
    @apply bg-white rounded-lg p-6 shadow-xl w-full max-w-md;
}
'@ | Set-Content -Encoding utf8 $cssPath
        Write-Host "✓ Created CSS file for POS app" -ForegroundColor Green
    }
}

# 2) تنظيف أي عمليات قد تقفل ملفات Electron
Write-Host "Stopping any running Electron processes..." -ForegroundColor Yellow
$procs = @("Supermarket Admin", "Supermarket POS", "electron", "Supermarket Admin.exe", "Supermarket POS.exe")
foreach ($p in $procs) { 
    Get-Process -Name $p -ErrorAction SilentlyContinue | ForEach-Object {
        try { 
            Write-Host "Stopping process: $($_.ProcessName)" -ForegroundColor Yellow
            $_.CloseMainWindow() | Out-Null
            Start-Sleep -Seconds 2
            if (!$_.HasExited) { 
                $_.Kill() 
                Write-Host "Force killed: $($_.ProcessName)" -ForegroundColor Red
            }
        }
        catch { 
            Write-Warning "Could not stop process: $p" 
        }
    }
}
Start-Sleep -Seconds 3

# 3) بناء كل تطبيق
foreach ($APP in $APPS) {
    if (-not (Test-Path $APP)) {
        Write-Host "❌ App path not found: $APP" -ForegroundColor Red
        continue
    }
    
    Write-Host "`n=== Rebuilding: $APP ===" -ForegroundColor Cyan

    Ensure-ElectronMain $APP
    Patch-PackageJson $APP
    Switch-To-HashRouter $APP
    Ensure-Pos-CSS $APP

    # احذف مجلد dist القديم
    $distPath = Join-Path $APP "dist"
    if (Test-Path $distPath) {
        try { 
            Remove-Item -Recurse -Force -Path $distPath -ErrorAction Stop
            Write-Host "✓ Cleared old dist folder" -ForegroundColor Green
        } 
        catch { 
            Write-Host "⚠ Could not clear dist folder: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    # اختر مدير الحزم
    $PM = Get-PkgMgr $APP
    Write-Host "Using package manager: $PM" -ForegroundColor Yellow

    try {
        Push-Location $APP
        
        # التثبيت
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        if ($PM -eq "yarn") {
            yarn install
        } else {
            npm install
        }
        
        # البناء
        Write-Host "Building app..." -ForegroundColor Yellow
        if ($PM -eq "yarn") {
            yarn build
        } else {
            npm run build
        }
        
        # التغليف
        Write-Host "Packaging Electron app..." -ForegroundColor Yellow
        $env:USE_HARD_LINKS = "false"
        if ($PM -eq "yarn") {
            yarn electron-pack
        } else {
            npm run electron-pack
        }
        
        Pop-Location
        Write-Host "✔ Successfully built: $APP" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Build failed for $APP : $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
    }
}

Write-Host "`n✅ All builds complete. Check dist/ folders in admin-app and pos-app." -ForegroundColor Green
Write-Host "📍 Admin App: $ROOT\admin-app\dist" -ForegroundColor Cyan
Write-Host "📍 POS App: $ROOT\pos-app\dist" -ForegroundColor Cyan