# CLAUDE.md - Правила разработки проекта BlockBuster Volleyball

## Обязательные правила

1. **НИКОГДА не запускай `npm run dev`** - всегда используй `npm run build` для проверки ошибок компиляции
2. **Всегда используй Desktop Commander MCP** для работы с файлами
3. **При любых изменениях кода запускай `npm run build`** для проверки на ошибки

## Технологический стек

- **Frontend**: Next.js 14/16, TypeScript, Tailwind CSS 4 (preview)
- **Backend**: Supabase Edge Functions, PostgreSQL
- **AI**: OpenAI для эмбеддингов, Cerebras для чат-бота
- **Vector DB**: Qdrant для хранения векторов
- **Monitoring**: Sentry для отслеживания ошибок
- **Testing**: Vitest, Testing Library

## Структура проекта

```
/Users/bogdanfesenko/StudioProjects/Volleyball/
├── volleyball_zzh/          # Основной проект фронтенда
├── package/                 # Backend и Edge Functions
│   ├── supabase/           # Edge Functions
│   │   └── functions/      
│   │       ├── chatbot/    # AI чат-бот
│   │       └── league-results/  # Парсер результатов лиги
│   └── docs/               # Документация
```

## Важные файлы документации

- `@/docs/ARCHITECTURE.md` - Архитектура системы
- `@/docs/PRD.md` - Product Requirements Document  
- `@/docs/STYLE_GUIDE.md` - Дизайн-система и стайлгайд
- `@/docs/design-tokens.json` - Дизайн токены

## Ключевые команды

```bash
# Сборка проекта (ОБЯЗАТЕЛЬНО после изменений)
cd /Users/bogdanfesenko/StudioProjects/Volleyball/volleyball_zzh
npm run build

# Запуск dev сервера (только для тестирования)
npm run dev

# Развертывание Edge Functions
cd /Users/bogdanfesenko/StudioProjects/Volleyball/package
/usr/local/bin/supabase functions deploy [function-name] --no-verify-jwt

# Установка секретов для Edge Functions
/usr/local/bin/supabase secrets set KEY="value"
```

## Решенные проблемы

1. **Исправлена опечатка в Edge Function**: ΟΡΕΝΑΙ_API_KEY → OPENAI_API_KEY
2. **Добавлены недостающие переменные окружения**: VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
3. **Развернуты Edge Functions**: chatbot и league-results с корректными CORS заголовками

## Переменные окружения

### Frontend (.env)
```
VITE_SUPABASE_URL=https://kxwmkvtxkaczuonnnxlj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_FUNCTIONS_URL=https://kxwmkvtxkaczuonnnxlj.functions.supabase.co
```

### Edge Functions (Supabase Secrets)
```
OPENAI_API_KEY
CEREBRAS_API_KEY
QDRANT_URL
QDRANT_API_KEY
QDRANT_COLLECTION
```

## Принципы разработки

1. **Documentation-First**: Всегда читай документацию перед внесением изменений
2. **Type-Safety**: Используй TypeScript типы везде
3. **Error Handling**: Обрабатывай все ошибки с помощью AppError классов
4. **Testing**: Пиши тесты для всех новых компонентов
5. **Performance**: Мониторь производительность через Sentry

## Текущий статус

- ✅ Phase 1: UI Kit завершен (9 компонентов)
- ✅ Phase 2: React Query интеграция
- 🔄 Phase 3: Тестирование (в процессе)
- 📅 Phase 4: 3D визуализация (планируется)
- 📅 Phase 5: AI чат (развернут, требует тестирования)
- 📅 Phase 6: Оптимизация и деплой