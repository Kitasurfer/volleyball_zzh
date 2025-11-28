#!/bin/bash

# Скрипт для перезапуска dev сервера с новыми переменными окружения

echo "🔄 Останавливаю текущий Vite сервер..."

# Найти и убить процесс vite
VITE_PID=$(ps aux | grep 'vite/bin/vite.js' | grep -v grep | awk '{print $2}')

if [ -n "$VITE_PID" ]; then
  echo "   Найден процесс Vite: $VITE_PID"
  kill $VITE_PID
  sleep 2
  echo "   ✅ Vite остановлен"
else
  echo "   ℹ️  Vite не запущен"
fi

echo ""
echo "🚀 Запускаю Vite с новыми переменными окружения..."
echo "   Локальный chatbot: http://localhost:54321/functions/v1/chatbot"
echo ""

# Запустить vite
pnpm dev
