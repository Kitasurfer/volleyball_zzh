# Отображение медиа (картинок и видео) в чате

## Архитектура

Чатбот поддерживает отображение картинок и видео в ответах. Медиа привязывается к чанкам в базе знаний Qdrant.

### Структура данных

Каждый чанк в Qdrant может содержать массив `media`:

```json
{
  "content_id": "referee-gestures-ru",
  "title": "Жесты судей в волейболе",
  "language": "ru",
  "chunks": [
    {
      "chunk_index": 0,
      "text": "Жесты судей: Удаление (Красная карточка)...",
      "headings": ["Жесты судей", "Удаление"],
      "media": [
        {
          "id": "red-card-gesture-ru",
          "url": "https://example.com/red-card.png",
          "type": "image",
          "title": "Красная карточка - Удаление",
          "description": "Судья показывает красную карточку"
        }
      ]
    }
  ]
}
```

### Поля media

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | Уникальный идентификатор медиа |
| `url` | string | URL картинки или видео |
| `type` | string | `image` или `video` |
| `title` | string? | Заголовок медиа |
| `description` | string? | Описание медиа |
| `classification` | string? | Категория (опционально) |

## Загрузка данных с медиа

### 1. Подготовка payload.json

Создайте файл `payload.json` с чанками и медиа:

```bash
docs/admin/vigruzki/<slug>/<lang>/payload.json
```

Пример структуры уже создан:
- `docs/admin/vigruzki/referee-gestures/de/payload.json` (немецкий)
- `docs/admin/vigruzki/referee-gestures/ru/payload.json` (русский)
- `docs/admin/vigruzki/referee-gestures/en/payload.json` (английский)

### 2. Загрузка в Qdrant

```bash
curl -X POST "https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/ingest-content/upload-chunks" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d @docs/admin/vigruzki/referee-gestures/ru/payload.json
```

### 3. Проверка

После загрузки спросите в чате:
- "Какой жест судьи при удалении игрока?"
- "Покажи жест красной карточки"
- "Schiedsrichterzeichen bei Ausschluss"

## Источники картинок

### Рекомендуемые источники

1. **Supabase Storage** (рекомендуется)
   - Загрузите картинки в bucket `documents` или `media`
   - URL: `https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/<bucket>/<path>`

2. **Внешние URL**
   - Wikipedia Commons
   - FIVB официальные ресурсы
   - Любые публичные URL картинок

### Пример загрузки в Supabase Storage

```bash
# Через Dashboard: Storage → documents → Upload
# Или через CLI:
supabase storage cp ./image.png documents/referee-gestures/red-card.png
```

## Отображение в UI

Компонент `ChatMessageItem` автоматически отображает медиа из citations:

- **Картинки**: отображаются inline с возможностью увеличения
- **YouTube видео**: встраиваются как iframe
- **Другие видео**: показывается ссылка с превью

## Тестовые данные

Созданы тестовые payload файлы с жестами судей:

| Язык | Файл |
|------|------|
| DE | `docs/admin/vigruzki/referee-gestures/de/payload.json` |
| RU | `docs/admin/vigruzki/referee-gestures/ru/payload.json` |
| EN | `docs/admin/vigruzki/referee-gestures/en/payload.json` |

Для загрузки выполните команды из раздела "Загрузка в Qdrant" для каждого языка.

## Troubleshooting

### Картинки не отображаются

1. Проверьте, что URL картинки доступен публично
2. Проверьте CORS настройки для внешних URL
3. Убедитесь, что `media` массив передаётся в payload при загрузке

### Медиа не возвращается в ответе

1. Проверьте, что чанк с медиа имеет достаточно высокий score релевантности
2. Проверьте debug endpoint: `/chatbot/debug-search`
