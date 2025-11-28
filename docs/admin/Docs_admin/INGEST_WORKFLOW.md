# Полный конвейер загрузки правил (Docling → чанки → Qdrant)

> Этот гайд нужен, чтобы любой новый документ (PDF или Markdown) можно было прогнать на **трёх языках** без ручных объяснений.

## 1. Исходные данные
- **Исходники** складываем в `docs/admin/zagryzki/` (PDF, DOCX → сначала в PDF).
- Для перевода/ручной правки используем `docs/admin/vigruzki/<slug>/<lang>/source.md`.
- Под один документ резервируем **один slug**. Пример: `sbvv-regeln-2025` и три языковых подпапки `de`, `en`, `ru`.

## 2. Скрипт подготовки чанков
Скрипт уже лежит в репо: `scripts/prepare-rule-chunks.mjs`. Он умеет:
- принимать **URL** или **локальный файл** (`--url=...` либо `--file=...`)
- автоматически вызывать Docling для PDF
- пропускать Docling, если вход — готовый Markdown/текст (например переведённая версия)
- сохранять результат в нужную папку (source.md, chunks.json, payload.json, превью чанков)

### Команда для PDF (Docling включается автоматически)
```bash
node scripts/prepare-rule-chunks.mjs \
  --file="docs/admin/zagryzki/2025_Regeländerungen-SBVV_250724_193703.pdf" \
  --title="Regeländerungen SBVV 2025/2026" \
  --language=de \
  --slug=sbvv-regeln-2025 \
  --out="docs/admin/vigruzki/sbvv-regeln-2025/de"
```

### Команда для перевода (готовый Markdown)
```bash
node scripts/prepare-rule-chunks.mjs \
  --file="docs/admin/vigruzki/sbvv-regeln-2025/en/source.md" \
  --title="SBVV Rule Changes 2025/2026 (EN)" \
  --language=en \
  --slug=sbvv-regeln-2025 \
  --out="docs/admin/vigruzki/sbvv-regeln-2025/en"
```

После выполнения в целевой папке появятся:
- `source.md` — markdown (Docling или ручной)
- `chunks/` — превью каждого чанка в читаемом виде
- `chunks.json` — список чанков со сниппетами
- `payload.json` — готов к загрузке через Edge Function

## 3. Загрузка чанков в Qdrant
Каждый язык загружается отдельно через Supabase Edge Function `ingest-content/upload-chunks` (уже задеплоена). Пример:
```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/ingest-content/upload-chunks" \
  -H "Authorization: Bearer <SERVICE_KEY>" \
  -H "Content-Type: application/json" \
  -d @docs/admin/vigruzki/sbvv-regeln-2025/de/payload.json
```
Повторить для `…/en/payload.json` и `…/ru/payload.json`. Результат в консоли: `{ "success": true, "uploaded": <кол-во>, "content_id": "sbvv-regeln-2025-<lang>" }`.

## 4. Проверка чат-бота
1. **Debug:** `curl -X POST https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/chatbot/debug-flow ...` — смотрим `raw_results`/`relevant_results`.
2. **Реальный запрос:**
```bash
curl -s -X POST "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/chatbot" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"question":"Какие изменения в правиле 7.4?","language":"ru"}'
```
Проверяем, что `citations` содержит три языковых источника.

## 5. Контрольный список
- [ ] Исходный файл (PDF или markdown) лежит в `docs/admin/zagryzki/` или `docs/admin/vigruzki/<slug>/<lang>/`.
- [ ] Скрипт `prepare-rule-chunks` отработал без ошибок для `de`, `en`, `ru`.
- [ ] В каждой языковой папке есть `payload.json` и превью чанков.
- [ ] Все три payload’а загружены через `ingest-content/upload-chunks` (проверить ответ `success`).
- [ ] `chatbot`/`debug-flow` возвращает цитаты по новому документу.

## 6. Полезные ссылки и ключи
- Docling service: `https://volleyball-docling.onrender.com`
- Edge Function (ingest): `https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/ingest-content/upload-chunks`
- Chatbot function: `https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/chatbot`
- Анонимный ключ: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I`

> Если нужно полностью удалить документ: `curl -X POST https://.../ingest-content/delete-by-content -d '{"content_id":"sbvv-regeln-2025-ru"}' ...` и повторить для остальных языков.
