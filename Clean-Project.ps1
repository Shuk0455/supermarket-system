Write-Host "🧹 تنظيف المشروع للبدء من الصفر..." -ForegroundColor Yellow

# التحقق من الملفات/Mجلدات المراد حذفها
$ItemsToRemove = @(
    ".git",
    ".gitignore",
    ".github"  # إذا كان لديك مجلد GitHub Actions
)

Write-Host "`n📋 الملفات/المجلدات التي سيتم حذفها:" -ForegroundColor Cyan
foreach ($item in $ItemsToRemove) {
    if (Test-Path $item) {
        Write-Host "   ❌ $item" -ForegroundColor Red
    } else {
        Write-Host "   ✅ $item (غير موجود)" -ForegroundColor Gray
    }
}

# طلب التأكيد
$confirmation = Read-Host "`n⚠️  هل تريد متابعة الحذف؟ (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "❌ تم إلغاء العملية" -ForegroundColor Red
    exit
}

# الحذف
foreach ($item in $ItemsToRemove) {
    if (Test-Path $item) {
        try {
            Remove-Item -Recurse -Force $item
            Write-Host "✅ تم حذف: $item" -ForegroundColor Green
        } catch {
            Write-Host "❌ فشل حذف: $item" -ForegroundColor Red
        }
    }
}

Write-Host "`n🎉 تم تنظيف المشروع بنجاح!" -ForegroundColor Cyan
Write-Host "يمكنك الآن البدء من جديد بتهيئة Git جديدة" -ForegroundColor Yellow