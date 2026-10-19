@echo off
title Rizofara Technology - Server Launcher
echo ====================================================
echo  Menjalankan Website Rizofara Technology
echo  Backend & Web Bundle : http://127.0.0.1:8000
echo  Swagger API Docs     : http://127.0.0.1:8000/docs
echo ====================================================
cd /d "%~dp0backend"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)
python run.py
pause
