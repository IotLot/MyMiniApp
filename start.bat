@echo off
echo Запускаю сервер на http://localhost:8000
echo Нажми Ctrl+C для остановки
python -m http.server 8000 --bind 0.0.0.0
pause