@echo off
title Rizofara Technology - Python Server
echo ====================================================
echo  Menjalankan Website Rizofara Technology di http://127.0.0.1:8000
echo ====================================================
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
python run.py
pause
