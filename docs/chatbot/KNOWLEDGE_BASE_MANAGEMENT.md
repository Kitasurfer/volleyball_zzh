# 📚 Управление базой знаний чат-бота

## Обзор

База знаний чат-бота хранится в Qdrant (векторная база данных). Документы разбиваются на chunks (фрагменты) и индексируются для семантического поиска.

---

## 🔧 Доступные API endpoints

### 1. Загрузка chunks напрямую

```bash
POST /functions/v1/ingest-content/upload-chunks
```

**Тело запроса:**
```json
{
  "content_id": "uuid-контента",
  "title": "Название документа",
  "language": "de",
  "source_file": "путь/к/файлу.pdf",
  "chunks": [
    { "text": "Текст фрагмента...", "headings": ["Заголовок"] }
  ]
}
```

### 2. Удаление по content_id

```bash
POST /functions/v1/ingest-content/delete-by-content
```

**Тело запроса:**
```json
{
  "content_id": "uuid-контента-для-удаления"
}
```

### 3. Создание индекса

```bash
POST /functions/v1/ingest-content/create-index
```

**Тело запроса:**
```json
{
  "field_name": "content_id",
  "field_type": "keyword"
}
```

---

## 📄 Загрузка нового PDF документа

### 🆕 Быстрый конвейер (Docling → превью → загрузка)

1. Запускаем скрипт подготовки чанков:

```bash
node scripts/prepare-rule-chunks.mjs \
  --url="https://example.com/volleyball-rules.pdf" \
  --title="Offizielle Volleyballregeln 2025-2028" \
  --language=de \
  --slug=volleyball-rules-2025
```

2. Скрипт создаёт структуру `docs/chatbot/generated/<slug>/<lang>/`:
   - `source.md` — markdown из Docling
   - `chunks.json` — список чанков + сниппеты
   - `payload.json` — готов к `upload-chunks`
   - `chunks/*.md` — читаемые файлы для ручного ревью

3. Проверяем чанки, при необходимости редактируем markdown или перезапускаем скрипт.

4. Загружаем в Qdrant одной командой:

```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/ingest-content/upload-chunks" \
  -H "Authorization: Bearer <SERVICE_KEY>" \
  -H "Content-Type: application/json" \
  -d @docs/chatbot/generated/volleyball-rules-2025/de/payload.json
```

5. Повторяем для `en` и `ru`, чтобы обеспечить идентичные чанки на трёх языках.

---

### Шаг 1: Обработка PDF через Docling

```bash
# Скачать PDF (если нужно)
curl -o /tmp/document.pdf "URL_PDF_ФАЙЛА"

# Отправить в Docling для извлечения текста
curl -X POST "https://volleyball-docling.onrender.com/process" \
  -F "file=@/tmp/document.pdf" \
  --max-time 600 \
  -o /tmp/docling-result.json
```

### Шаг 2: Разбить на chunks и загрузить

```python
import json
import requests

# Загрузить результат Docling
with open("/tmp/docling-result.json") as f:
    data = json.load(f)

markdown = data.get("markdown", "")

# Разбить на chunks (по ~1500 символов)
def split_markdown_into_chunks(md, max_size=1500):
    import re
    chunks = []
    lines = md.split('\n')
    current_chunk = ''
    current_headings = []
    heading_stack = []
    
    for line in lines:
        heading_match = re.match(r'^(#{1,6})\s+(.+)$', line)
        if heading_match:
            if len(current_chunk.strip()) > 50:
                chunks.append({'text': current_chunk.strip(), 'headings': list(current_headings)})
            level = len(heading_match.group(1))
            while len(heading_stack) >= level:
                heading_stack.pop()
            heading_stack.append(heading_match.group(2).strip())
            current_headings = list(heading_stack)
            current_chunk = ''
        else:
            current_chunk += line + '\n'
            if len(current_chunk) > max_size:
                chunks.append({'text': current_chunk.strip(), 'headings': list(current_headings)})
                current_chunk = ''
    
    if len(current_chunk.strip()) > 50:
        chunks.append({'text': current_chunk.strip(), 'headings': list(current_headings)})
    return chunks

chunks = split_markdown_into_chunks(markdown)

# Загрузить в Qdrant
url = "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/ingest-content/upload-chunks"
headers = {
    "Authorization": "Bearer YOUR_ANON_KEY",
    "Content-Type": "application/json"
}

# Загружать батчами по 5 chunks
batch_size = 5
for i in range(0, len(chunks), batch_size):
    batch = chunks[i:i+batch_size]
    payload = {
        "content_id": "YOUR_CONTENT_UUID",  # Создать новый UUID или использовать существующий
        "title": "Название документа",
        "language": "de",  # de, en, ru
        "source_file": "путь/к/файлу.pdf",
        "chunks": batch
    }
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    print(f"Batch {i//batch_size + 1}: {response.status_code}")
```

---

## 🗑️ Удаление документа из базы знаний

```bash
# Удалить все chunks для конкретного content_id
curl -X POST "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/ingest-content/delete-by-content" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content_id": "uuid-документа"}'
```

---

## 🔍 Проверка базы знаний

### Проверить количество точек в Qdrant

```bash
curl -s "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/chatbot/debug" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Тестовый поиск

```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/chatbot/debug-search" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question": "Ваш вопрос", "language": "de"}'
```

---

## 📋 Текущие документы в базе

| content_id | Название | Chunks | Язык |
|------------|----------|--------|------|
| `3adb76fc-44ea-4792-a1ee-ddf4a2bf113a` | Offizielle Volleyballregeln 2025-2028 | 101 | de |

---

## ⚠️ Важные замечания

1. **Snippet limit**: Chunks хранятся с snippet до 1500 символов для контекста LLM
2. **Batch size**: Загружайте по 5 chunks за раз чтобы избежать timeout
3. **Индексы**: Для фильтрации по полю нужен индекс (уже создан для `content_id` и `language`)
4. **Docling timeout**: Большие PDF могут обрабатываться 5-10 минут

---

## 🔑 Ключи доступа

```
SUPABASE_URL=https://kxwmkvtxkaczuonnnxlj.supabase.co
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I
```

---

**Дата**: 25 ноября 2025
