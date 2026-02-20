# 🔐 Настройка секретов для AI чат-бота

## ✅ Что уже сделано:

1. **league-results функция задеплоена** (версия 9) — таблицы лиг теперь работают
2. **Qdrant кластер создан**: `f1aa8cca-cede-4a92-ad87-7b2a3d837696`
3. **Cerebras API ключ получен**: `<CEREBRAS_API_KEY>`

---

## ⚠️ Что нужно сделать вручную:

### 1. Создать коллекцию в Qdrant Cloud

Откройте: https://cloud.qdrant.io/accounts/fe94a3a3-e729-45e3-9420-f814303fa40d/clusters/f1aa8cca-cede-4a92-ad87-7b2a3d837696/overview

1. Нажмите **Collections** → **Create Collection**
2. Настройки:
   - **Name**: `content_vectors`
   - **Vector size**: `768`
   - **Distance**: `Cosine`
   - **On-disk storage**: включить (для Free tier)
3. Нажмите **Create**

---

### 2. Добавить секреты в Supabase

Откройте: https://supabase.com/dashboard/project/<YOUR_SUPABASE_PROJECT>/settings/functions

Нажмите **Add secret** и добавьте каждый секрет:

```bash
# Qdrant Vector Database
QDRANT_URL=https://<YOUR_QDRANT_CLUSTER>.cloud.qdrant.io
QDRANT_API_KEY=<YOUR_QDRANT_API_KEY>
QDRANT_COLLECTION=content_vectors

# Cerebras AI
CEREBRAS_API_KEY=<YOUR_CEREBRAS_API_KEY>
CEREBRAS_BASE_URL=https://api.cerebras.ai
CEREBRAS_CHAT_MODEL=llama3.1-8b
CEREBRAS_EMBED_MODEL=embedding-english-v1
```

**Важно**: Добавляйте каждый секрет отдельно через кнопку **Add secret**.

---

### 3. Запустить индексацию контента

После добавления секретов:

```bash
curl -X POST "https://<YOUR_SUPABASE_PROJECT>.functions.supabase.co/ingest-content" \
  -H "Authorization: Bearer <YOUR_SUPABASE_SERVICE_ROLE_KEY>"
```

**Ожидаемый результат**: `{"processed": 4}`

---

### 4. Проверить статус индексации

```sql
SELECT 
  vj.id,
  ci.title,
  vj.status,
  vj.error,
  vj.completed_at
FROM public.vector_jobs vj
JOIN public.content_items ci ON vj.content_id = ci.id
ORDER BY vj.created_at DESC;
```

**Статусы**:
- `pending` — ждет обработки
- `processing` — обрабатывается
- `completed` — успешно ✅
- `failed` — ошибка (смотрите поле `error`)

---

### 5. Тестировать чат-бот

```bash
curl -X POST "https://<YOUR_SUPABASE_PROJECT>.functions.supabase.co/chatbot" \
  -H "Authorization: Bearer <YOUR_SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Was sind die Regeländerungen für 2025/2026?",
    "language": "de"
  }'
```

---

### 6. Проверить таблицы лиг

```bash
curl "https://<YOUR_SUPABASE_PROJECT>.functions.supabase.co/league-results" \
  -H "Authorization: Bearer <YOUR_SUPABASE_SERVICE_ROLE_KEY>"
```

**Ожидаемый результат**: JSON с `standings`, `schedule`, `team`, `lastUpdated`

---

## 🎯 Чеклист

- [ ] Создана коллекция `content_vectors` в Qdrant Cloud
- [ ] Добавлены все 7 секретов в Supabase
- [ ] Запущена индексация контента
- [ ] Проверен статус vector_jobs (все `completed`)
- [ ] Протестирован чат-бот
- [ ] Проверены таблицы лиг

---

## 📊 Текущий статус

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| league-results | ✅ Задеплоено | Версия 9 |
| chatbot | ✅ Задеплоено | Версия 1 |
| ingest-content | ✅ Задеплоено | Версия 1 |
| Qdrant кластер | ✅ Создан | Нужна коллекция |
| Cerebras API | ✅ Ключ получен | |
| Секреты Supabase | ⚠️ Требуется | Добавить вручную |
| Vector jobs | ⏳ Pending | Ждут индексации |

---

**Дата**: 9 ноября 2025, 15:05  
**Статус**: Готово к финальной настройке секретов
