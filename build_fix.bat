@echo off
echo ============================================
echo  Running Prisma Generate + Backend Build
echo ============================================
echo.

cd /d "F:\developement\Web erp\programming\college-erp-clean\backend"
echo Current dir: %CD%
echo.

echo [1/3] Running prisma generate...
call npx prisma generate
if errorlevel 1 (
    echo.
    echo PRISMA GENERATE FAILED
    pause
    exit /b 1
)
echo.
echo === Prisma generate PASSED ===
echo.

echo [2/3] Running tsc (backend build)...
call npx tsc
if errorlevel 1 (
    echo.
    echo TSC BUILD FAILED
    pause
    exit /b 1
)
echo.
echo === Backend build PASSED ===
echo.

echo [3/3] Running frontend build...
cd /d "F:\developement\Web erp\programming\college-erp-clean\frontend"
call npm run build
if errorlevel 1 (
    echo.
    echo FRONTEND BUILD FAILED
    pause
    exit /b 1
)
echo.
echo === Frontend build PASSED ===
echo.

echo ============================================
echo  ALL BUILDS PASSED!
echo ============================================
echo.

cd /d "F:\developement\Web erp\programming\college-erp-clean"
echo Git diff:
git diff --stat
echo.
echo --- Schema changes ---
git diff backend/prisma/schema.prisma
echo.

echo Ready to commit and push. Press any key...
pause

git add backend/prisma/schema.prisma
git commit -m "fix: add classId to TeacherSubject schema for reliable multi-subject assignment persistence"
git push origin main

echo.
echo === DONE! Committed and pushed. ===
echo.
git log -1 --oneline
pause
