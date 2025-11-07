# League Results Proxy Server

## Проблема

Ваш фронтенд пытается получить данные таблицы с сайта VLW через Supabase Edge Function, но Edge Function не задеплоена (в `.env` файле placeholder URL).

## ⚠️ ВАЖНО: Файл переименован

Файл `league-proxy.js` был переименован в `league-proxy.cjs` из-за того, что в `package.json` указан `"type": "module"`. CommonJS файлы должны иметь расширение `.cjs` в ES module проектах.

## Решение для локальной разработки

Создан локальный Node.js прокси-сервер, который:
1. Запрашивает данные с сайта VLW
2. Парсит HTML и извлекает таблицу результатов
3. Возвращает данные в том же формате, что и Supabase Edge Function

## Как использовать

### Вариант 1: Запустить отдельно (рекомендуется для отладки)

В одном терминале запустите прокси-сервер:
```bash
npm run proxy
```

В другом терминале запустите фронтенд:
```bash
npm run dev
```

### Вариант 2: Запустить все вместе

Сначала установите `concurrently`:
```bash
pnpm add -D concurrently
```

Затем запустите все вместе:
```bash
npm run dev:all
```

## Эндпоинт

Локальный прокси доступен по адресу:
```
http://localhost:3001/league-results
```

## Проверка работы

1. Запустите прокси-сервер: `npm run proxy`
2. Откройте в браузере: http://localhost:3001/league-results
3. Вы должны увидеть JSON с данными таблицы

## Для продакшна

Для продакшна вам нужно:
1. Задеплоить Supabase Edge Function из папки `/supabase/functions/league-results`
2. Обновить `.env` файл с реальным URL Supabase
3. Удалить или закомментировать локальный прокси

## Структура ответа

```json
{
  "standings": [
    {
      "position": 1,
      "name": "Team Name",
      "matches": 4,
      "wins": 4,
      "sets": "8:2",
      "points": 10
    }
  ],
  "team": {
    "position": 8,
    "name": "SG TSV Zizishausen/SKV Unterensingen",
    "matches": 4,
    "wins": 1,
    "sets": "3:6",
    "points": 4
  },
  "lastUpdated": "2025-01-07T10:30:00.000Z"
}
```

## Troubleshooting

### Ошибка "Unable to parse standings data"
- Проверьте, что сайт VLW доступен
- Возможно изменилась структура HTML на сайте
- Проверьте консоль сервера для деталей

### Ошибка CORS
- Убедитесь, что прокси-сервер запущен
- Проверьте, что в `.env` указан правильный URL: `http://localhost:3001`

### Данные не отображаются на фронтенде
1. Откройте DevTools → Network
2. Проверьте запрос к `/league-results`
3. Убедитесь, что запрос возвращает 200 OK
4. Проверьте консоль на ошибки React Query
