# 🤖 Настройка AI сервисов для чат-бота

## 1. Qdrant (Vector Database)

### Вариант A: Qdrant Cloud (Рекомендуется)

1. Зарегистрируйтесь на https://cloud.qdrant.io/
2. Создайте новый кластер (Free tier достаточно)
3. Создайте коллекцию `content_vectors`:
   - Vector size: **768** (для Cerebras embedding-english-v1)
   - Distance: **Cosine**
4. Скопируйте:
   - Cluster URL (например: `https://xyz.qdrant.io`)
   - API Key

### Вариант B: Локальный Qdrant (для тестирования)

```bash
docker run -p 6333:6333 qdrant/qdrant
```

URL: `http://localhost:6333` (без API key)

---

## 2. Cerebras AI

### Получить API ключ:

1. Зарегистрируйтесь на https://cloud.cerebras.ai/
2. Перейдите в **API Keys**
3. Создайте новый ключ
4. Скопируйте API key (начинается с `csk-...`)

**Модели**:
- Chat: `llama3.1-8b` (быстрая и точная)
- Embeddings: `embedding-english-v1` (768 размерность)

---

## 3. Добавить переменные в Supabase

Откройте: https://supabase.com/dashboard/project/kxwmkvtxkaczuonnnxlj/settings/functions

Нажмите **Add secret** и добавьте:

```bash
# Qdrant
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=content_vectors

# Cerebras
CEREBRAS_API_KEY=csk-your-cerebras-key
CEREBRAS_BASE_URL=https://api.cerebras.ai
CEREBRAS_CHAT_MODEL=llama3.1-8b
CEREBRAS_EMBED_MODEL=embedding-english-v1

# Опционально (уже есть по умолчанию)
CHAT_MAX_CONTEXT_DOCS=6
CHAT_MAX_OUTPUT_TOKENS=800
INGEST_BATCH_SIZE=5
```

---

## 4. Создать Qdrant коллекцию

### Через Qdrant Cloud UI:

1. Откройте ваш кластер
2. **Collections** → **Create Collection**
3. Настройки:
   - Name: `content_vectors`
   - Vector size: `768`
   - Distance: `Cosine`
   - На-диске: включить (для Free tier)

### Через API:

```bash
curl -X PUT "https://your-cluster.qdrant.io/collections/content_vectors" \
  -H "api-key: your_qdrant_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    }
  }'
```

---

## 5. Запустить индексацию

После настройки переменных окружения:

```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.functions.supabase.co/ingest-content" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I"
```

**Ожидаемый результат**:
```json
{"processed": 4}
```

---

## 6. Проверить статус индексации

```sql
SELECT 
  vj.id,
  ci.title,
  vj.status,
  vj.error,
  vj.started_at,
  vj.completed_at
FROM public.vector_jobs vj
JOIN public.content_items ci ON vj.content_id = ci.id
ORDER BY vj.created_at DESC;
```

**Статусы**:
- `pending` — ждет обработки
- `processing` — обрабатывается
- `completed` — успешно
- `failed` — ошибка (смотрите поле `error`)

---

## 7. Тестировать чат-бот

```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.functions.supabase.co/chatbot" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Was sind die Regeländerungen für 2025/2026?",
    "language": "de"
  }'
```

---

## 8. Настроить автоматическую индексацию (опционально)

### Supabase Cron Job:

1. Откройте: https://supabase.com/dashboard/project/kxwmkvtxkaczuonnnxlj/database/cron-jobs
2. Создайте новый Cron Job:

```sql
SELECT
  net.http_post(
    url:='https://kxwmkvtxkaczuonnnxlj.functions.supabase.co/ingest-content',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb
  ) as request_id;
```

3. Schedule: `*/5 * * * *` (каждые 5 минут)

---

## 🎯 Чеклист

- [ ] Создан Qdrant кластер
- [ ] Создана коллекция `content_vectors` (768 размерность, Cosine)
- [ ] Получен Cerebras API key
- [ ] Добавлены все переменные окружения в Supabase
- [ ] Запущена индексация контента
- [ ] Проверен статус vector_jobs (все `completed`)
- [ ] Протестирован чат-бот
- [ ] (Опционально) Настроен Cron Job для автоиндексации

---

## ⚠️ Troubleshooting

### Ошибка: "Missing environment variable: QDRANT_URL"
→ Добавьте переменные окружения в Supabase Dashboard

### Ошибка: "Embedding request failed (401)"
→ Проверьте CEREBRAS_API_KEY

### Ошибка: "Qdrant request failed (404)"
→ Создайте коллекцию `content_vectors` в Qdrant

### Ошибка: "vector dimension mismatch"
→ Убедитесь, что коллекция создана с размерностью 768

---

**Дата**: 9 ноября 2025  
**Статус**: Готово к настройке AI сервисов
