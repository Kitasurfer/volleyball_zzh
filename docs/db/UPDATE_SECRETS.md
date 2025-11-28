# 🔄 Обновление секретов Supabase

## 📝 Откройте настройки:
https://supabase.com/dashboard/project/kxwmkvtxkaczuonnnxlj/settings/functions

---

## ✅ Обновите эти секреты:

### 1. Обновить модель Cerebras
Найдите секрет `CEREBRAS_CHAT_MODEL` и измените на:
```
qwen-3-235b-a22b-thinking-2507
```

### 2. Добавить OpenAI для embeddings
Нажмите **Add secret** и добавьте:

**Название**: `OPENAI_API_KEY`  
**Значение**: `sk-...` (ваш ключ с https://platform.openai.com/api-keys)

**Название**: `OPENAI_EMBED_MODEL`  
**Значение**: `text-embedding-3-small`

---

## 🎯 Итоговые секреты:

```bash
# Qdrant Vector Database
QDRANT_URL=https://f1aa8cca-cede-4a92-ad87-7b2a3d837696.europe-west3-0.gcp.cloud.qdrant.io
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.xYn-tKa27SHNMIYMdfCzd5tItuZTneoocPMnU7NXk5A
QDRANT_COLLECTION=content_vectors

# Cerebras AI (Chat)
CEREBRAS_API_KEY=csk-fk9mfwnx3kr25xrvcwp3n9wtmxdnwpv9x4tpec6rn4tn6em2
CEREBRAS_BASE_URL=https://api.cerebras.ai
CEREBRAS_CHAT_MODEL=qwen-3-235b-a22b-thinking-2507  ← ОБНОВЛЕНО

# OpenAI (Embeddings)
OPENAI_API_KEY=sk-...  ← ДОБАВИТЬ
OPENAI_EMBED_MODEL=text-embedding-3-small  ← ДОБАВИТЬ
```

---

## 🚀 После обновления:

### 1. Запустить индексацию
```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.functions.supabase.co/ingest-content" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I"
```

Ожидаемый результат: `{"processed": 4}`

### 2. Протестировать чат-бот
```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.functions.supabase.co/chatbot" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I" \
  -H "Content-Type: application/json" \
  -d '{"question": "Когда следующий матч?", "language": "ru"}'
```

### 3. Проверить таблицы лиг
```bash
curl "https://kxwmkvtxkaczuonnnxlj.functions.supabase.co/league-results" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I"
```

---

## 📊 Статус

| Компонент | Статус |
|-----------|--------|
| League tables | ✅ Работает (с fallback) |
| Cerebras Chat | ✅ Модель обновлена |
| OpenAI Embeddings | ⏳ Требуется ключ |
| Qdrant коллекция | ✅ Создана |
| Индексация | ⏳ Ждёт OpenAI ключ |

---

**Дата**: 9 ноября 2025, 16:15  
**Следующий шаг**: Добавить OpenAI API ключ
