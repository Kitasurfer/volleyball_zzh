# 🔧 Исправление настройки AI

## ❌ Проблема

Cerebras API **не предоставляет embeddings** — только chat модели:
- ✅ `gpt-oss-120b` (chat)
- ✅ `llama3.1-8b` (chat)
- ❌ `embedding-english-v1` (не существует)

## ✅ Решение

Используем **OpenAI API** для embeddings (или бесплатную альтернативу).

---

## 🔑 Вариант 1: OpenAI (платно, но надёжно)

### 1. Получить API ключ
https://platform.openai.com/api-keys

### 2. Обновить секреты в Supabase
https://supabase.com/dashboard/project/kxwmkvtxkaczuonnnxlj/settings/functions

Замените:
```bash
# Удалите эти секреты:
CEREBRAS_EMBED_MODEL=embedding-english-v1

# Добавьте:
OPENAI_API_KEY=sk-...
OPENAI_EMBED_MODEL=text-embedding-3-small
```

Оставьте:
```bash
CEREBRAS_API_KEY=csk-fk9mfwnx3kr25xrvcwp3n9wtmxdnwpv9x4tpec6rn4tn6em2
CEREBRAS_BASE_URL=https://api.cerebras.ai
CEREBRAS_CHAT_MODEL=gpt-oss-120b
```

---

## 🆓 Вариант 2: Бесплатная альтернатива (Hugging Face)

### 1. Получить API ключ
https://huggingface.co/settings/tokens

### 2. Обновить секреты в Supabase
```bash
# Удалите:
CEREBRAS_EMBED_MODEL=embedding-english-v1

# Добавьте:
HF_API_KEY=hf_...
HF_EMBED_MODEL=sentence-transformers/all-MiniLM-L6-v2
HF_BASE_URL=https://api-inference.huggingface.co
```

---

## 🔄 После обновления секретов

### 1. Перезапустить индексацию
```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.functions.supabase.co/ingest-content" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I"
```

### 2. Протестировать чат-бот
```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.functions.supabase.co/chatbot" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I" \
  -H "Content-Type: application/json" \
  -d '{"question": "Когда следующий матч?", "language": "ru"}'
```

---

## 📊 Текущий статус

| Компонент | Статус | Проблема |
|-----------|--------|----------|
| league-results | ⚠️ 500 | VLW блокирует запросы |
| chatbot | ❌ 500 | Нет embeddings API |
| ingest-content | ❌ 503 | Нет embeddings API |
| Cerebras Chat | ✅ Работает | gpt-oss-120b |
| Cerebras Embeddings | ❌ Не существует | - |

---

## 🎯 Рекомендация

**Используйте OpenAI** для embeddings:
- Модель `text-embedding-3-small` стоит $0.02 за 1M токенов
- Для вашего контента (~4 статьи) = ~$0.001
- Надёжно и быстро

**Альтернатива**: Hugging Face бесплатно, но медленнее и менее точно.

---

**Дата**: 9 ноября 2025, 16:10  
**Статус**: Требуется добавить OpenAI API ключ
