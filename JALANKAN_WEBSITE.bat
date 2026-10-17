@echo off
title TechSolution Studio - Python Server
echo ====================================================
echo  Menjalankan Website TechSolution di http://127.0.0.1:8000
echo ====================================================
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
python run.py
pause
