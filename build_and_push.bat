@echo off
setlocal enabledelayedexpansion
echo ============================================
echo  College ERP - TeacherSubject classId Fix
echo  Build, Verify, Commit, and Push
echo ============================================
echo.

:: Backend build (includes prisma generate + tsc)
echo [1/4] Building backend...
cd /d "F:\developement\Web erp\programming\college-erp-clean\backend"
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ BACKEND BUILD FAILED - fix errors before proceeding
    pause
    exit /b 1
)
echo ✅ Backend build succeeded
echo.

:: Frontend build
echo [2/4] Building frontend...
cd /d "F:\developement\Web erp\programming\college-erp-clean\frontend"
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ FRONTEND BUILD FAILED - fix errors before proceeding
    pause
    exit /b 1
)
echo ✅ Frontend build succeeded
echo.

:: Show diff
echo [3/4] Showing git diff...
cd /d "F:\developement\Web erp\programming\college-erp-clean"
echo.
git diff --stat
echo.
echo --- Detailed diff ---
git diff backend/prisma/schema.prisma
echo.

:: Commit and push
echo [4/4] Committing and pushing...
git add backend/prisma/schema.prisma
git commit -m "fix: add classId to TeacherSubject schema for reliable subject assignment persistence

The TeacherSubject model was missing the classId field in the Prisma schema,
but the backend service code (teacher.assignment.service.ts and teacher.service.ts)
was already writing classId to TeacherSubject on create and update operations.

Since Prisma strictly validates fields against the schema, every create/update
that included classId would throw 'Unknown arg classId', causing all subject
assignment saves to fail silently (caught by try/catch, returned as 400 error).

Fix:
- Added classId (String?, optional for backward compat) to TeacherSubject model
- Added class relation (Class?) with named relation 'ClassTeacherSubjects'
- Added reverse relation teacherSubjects[] on the Class model

This allows the existing backend code to correctly persist exact classId+subjectId
pairs on TeacherSubject, enabling reliable multi-subject assignment for teachers."

if errorlevel 1 (
    echo.
    echo ❌ COMMIT FAILED
    pause
    exit /b 1
)
echo.
echo ✅ Committed successfully

:: Show commit info
echo.
echo --- Commit details ---
git log -1 --oneline
git log -1 --format="Hash: %%H"
echo.

:: Push
git push origin main
if errorlevel 1 (
    echo.
    echo ❌ PUSH FAILED
    pause
    exit /b 1
)
echo.
echo ✅ Pushed to origin/main successfully
echo.
echo ============================================
echo  All done! Build passed, committed, pushed.
echo ============================================
pause
