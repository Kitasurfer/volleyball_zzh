# 🤖 Настройка Чатбота

## ✅ Что уже готово:

1. **Cerebras AI** - бесплатная модель `qwen-3-235b-a22b-thinking-2507`
2. **Qdrant** - векторная база для поиска
3. **Edge Functions** - все задеплоены

---

## 🔑 Шаг 1: Проверь ключи в Supabase

Зайди в Supabase Dashboard:
```
https://supabase.com/dashboard/project/kxwmkvtxkaczuonnnxlj/settings/secrets
```

Убедись что есть:
- ✅ `CEREBRAS_API_KEY` = `csk-fk9mfwnx3kr25xrvcwp3n9wtmxdnwpv9x4tpec6rn4tn6em2`
- ✅ `CEREBRAS_CHAT_MODEL` = `qwen-3-235b-a22b-thinking-2507`
- ✅ `QDRANT_URL` = `https://f1aa8cca-cede-4a92-ad87-7b2a3d837696.europe-west3-0.gcp.cloud.qdrant.io`
- ✅ `QDRANT_API_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.xYn-tKa27SHNMIYMdfCzd5tItuZTneoocPMjU7NXk5A`
- ✅ `QDRANT_COLLECTION` = `content_vectors`

---

## 📊 Шаг 2: Создай Qdrant коллекцию

Зайди в Qdrant Dashboard:
```
https://cloud.qdrant.io/clusters
```

1. Выбери свой кластер
2. Нажми **Collections** → **Create Collection**
3. Название: `content_vectors`
4. Vector size: `768`
5. Distance: `Cosine`
6. Нажми **Create**

---

## 🚀 Шаг 3: Запусти индексацию контента

Выполни эту команду (замени на свой anon key если нужно):

```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.functions.supabase.co/ingest-content" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I"
```

Должен вернуть:
```json
{"processed": 4}
```

---

## 🧪 Шаг 4: Протестируй чатбот

```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.functions.supabase.co/chatbot" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I" \
  -H "Content-Type: application/json" \
  -d '{"question": "Когда следующий матч?", "language": "ru"}'
```

---

## 📝 Как работает чатбот:

1. **Вопрос пользователя** → генерируется embedding
2. **Поиск в Qdrant** → находит похожие тексты из контента
3. **Cerebras AI** → генерирует ответ на основе найденного контента
4. **Ответ с источниками** → возвращает текст + ссылки + фото

---

## 🎯 Что показывает чатбот:

- ✅ Ответы на вопросы о команде
- ✅ Информация о матчах и расписании
- ✅ Ссылки на страницы сайта
- ✅ Фотографии из контента
- ✅ Источники информации

---

## 🔐 Безопасность ключей:

**НЕ ХРАНИ КЛЮЧИ В КОДЕ!**

Все ключи должны быть только в:
1. **Supabase Secrets** (для Edge Functions)
2. **Netlify Environment Variables** (для фронтенда)
3. **`.env.local`** (только локально, НЕ коммитить!)

---

## 💰 Стоимость:

- ✅ **Cerebras** - БЕСПЛАТНО (лимит 60 запросов/минуту)
- ✅ **Qdrant Free Tier** - 1GB бесплатно
- ✅ **Supabase Free Tier** - достаточно для проекта

---

## 🐛 Если не работает:

1. Проверь логи:
```bash
# В Supabase Dashboard
https://supabase.com/dashboard/project/kxwmkvtxkaczuonnnxlj/logs/edge-functions
```

2. Проверь что коллекция создана в Qdrant

3. Проверь что контент проиндексирован (запусти ingest-content)

4. Проверь что все ключи правильные в Supabase Secrets
