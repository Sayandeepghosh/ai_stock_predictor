@echo off
echo Syncing with GitHub...
git add .
set /p commit_msg="Enter commit message (default: Auto-update): "
if "%commit_msg%"=="" set commit_msg=Auto-update
git commit -m "%commit_msg%"
git push origin main
echo Done!
pause
