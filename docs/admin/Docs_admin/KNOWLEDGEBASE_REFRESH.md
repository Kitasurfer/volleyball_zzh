# Полное обновление базы знаний (RESET + загрузка новых чанков)

> Процедуру выполняем только когда нужно очистить Qdrant и залить новый набор документов на всех языках.

## 1. Удалить текущие точки
```
curl -X POST "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/ingest-content/delete-by-content" \
  -H "Authorization: Bearer <SERVICE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"content_id":"sbvv-regeln-2025-de"}'
```
Повторить для `sbvv-regeln-2025-en`, `sbvv-regeln-2025-ru`, а также для остальных `content_id`, если они были залиты ранее. Если нужно удалить **все** записи, вызываем Supabase Edge Function несколько раз списком `content_id`. (Прямого "truncate" в Qdrant нет, используем delete-by-content.)

## 2. Перегенерировать чанки (при необходимости)
- DE: `node scripts/prepare-rule-chunks.mjs --file=docs/admin/zagryzki/...pdf --language=de --slug=sbvv-regeln-2025 --out=docs/admin/vigruzki/sbvv-regeln-2025/de`
- EN/RU: `node scripts/prepare-rule-chunks.mjs --file=docs/admin/vigruzki/sbvv-regeln-2025/<lang>/source.md --language=<lang> ...`

## 3. Загрузить новые чанки
```
for lang in de en ru; do
  curl -X POST "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/ingest-content/upload-chunks" \
    -H "Authorization: Bearer <SERVICE_KEY>" \
    -H "Content-Type: application/json" \
    -d @docs/admin/vigruzki/sbvv-regeln-2025/$lang/payload.json;
done
```
Ответ должен содержать `"success": true` и `content_id": "sbvv-regeln-2025-<lang>`.

## 4. Проверить chatbot
```
curl -s -X POST "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/chatbot" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"question":"Какие изменения внесены в правило 7.4?","language":"ru"}'
```
Убедиться, что `citations` содержит RU/EN/DE документы.

## 5. Обновить документацию
- Зафиксировать изменения в `docs/chatbot/KNOWLEDGE_BASE_MANAGEMENT.md` (если добавляли новые slug’и).
- Обновить `docs/admin/Docs_admin/INGEST_WORKFLOW.md` при изменении процесса.
