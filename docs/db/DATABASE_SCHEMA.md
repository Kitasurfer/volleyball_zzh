# 🗄️ Схема базы данных Supabase

## ✅ Статус: Полностью настроена

**Проект**: `volleyball` (kxwmkvtxkaczuonnnxlj)  
**Регион**: EU North 1  
**Дата настройки**: 9 ноября 2025

---

## 📊 Таблицы

### 1. **content_items** (4 записи)
Хранит статьи, новости, правила волейбола.

**Колонки**:
- `id` (uuid, PK) — уникальный идентификатор
- `title` (text) — заголовок
- `slug` (text) — URL-адрес (уникальный для языка)
- `language` (text) — язык (de/en/ru)
- `status` (text) — статус (draft/published)
- `type` (text) — тип (article/news/announcement)
- `summary` (text) — краткое описание
- `body_markdown` (text) — текст в Markdown
- `body_html` (text) — текст в HTML
- `tags` (text[]) — теги
- `author_id` (uuid) — автор
- `published_at` (timestamptz) — дата публикации
- `created_at`, `updated_at` (timestamptz)

**RLS Политики**:
- ✅ Публичное чтение опубликованного контента
- ✅ Админ может управлять всем контентом

**Индексы**:
- `slug`, `type`, `status`

---

### 2. **media_assets** (0 записей)
Хранит метаданные загруженных медиафайлов.

**Колонки**:
- `id` (uuid, PK)
- `storage_path` (text, unique) — путь в Storage
- `title` (text) — название
- `description` (text) — описание
- `language` (text) — язык
- `media_type` (text) — тип (image/video/audio/document)
- `width`, `height` (int) — размеры изображения
- `duration_seconds` (numeric) — длительность видео/аудио
- `metadata` (jsonb) — дополнительные данные
- `created_at`, `updated_at` (timestamptz)

**RLS Политики**:
- ✅ Публичное чтение
- ✅ Админ может управлять

**Индексы**:
- `language`, `media_type`

---

### 3. **content_media_links** (0 записей)
Связывает контент с медиафайлами.

**Колонки**:
- `id` (uuid, PK)
- `content_id` (uuid, FK → content_items)
- `media_id` (uuid, FK → media_assets)
- `role` (text) — роль (inline/featured/gallery)
- `position` (int) — порядок отображения
- `created_at` (timestamptz)

**RLS Политики**:
- ✅ Публичное чтение
- ✅ Админ может управлять

---

### 4. **vector_jobs** (0 записей)
Очередь задач для индексации контента в AI-поиск.

**Колонки**:
- `id` (uuid, PK)
- `content_id` (uuid, FK → content_items)
- `status` (text) — pending/processing/completed/failed
- `error` (text) — текст ошибки
- `payload` (jsonb) — дополнительные данные
- `started_at`, `completed_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

**RLS Политики**:
- ✅ Только админ может читать и управлять

**Индексы**:
- `status`, `content_id`

---

### 5. **chat_sessions** (0 записей)
Сессии чата с посетителями.

**Колонки**:
- `id` (uuid, PK)
- `user_hash` (text) — хеш пользователя
- `language` (text) — язык
- `metadata` (jsonb) — дополнительные данные
- `created_at`, `last_activity` (timestamptz)

**RLS Политики**:
- ✅ Только админ может читать
- ✅ Service role может управлять

**Индексы**:
- `user_hash`, `language`

---

### 6. **chat_messages** (0 записей)
Сообщения в чате.

**Колонки**:
- `id` (uuid, PK)
- `session_id` (uuid, FK → chat_sessions)
- `role` (text) — system/user/assistant/tool
- `content` (text) — текст сообщения
- `citations` (jsonb) — ссылки на источники
- `metadata` (jsonb) — дополнительные данные
- `created_at` (timestamptz)

**RLS Политики**:
- ✅ Только админ может читать
- ✅ Service role может управлять

**Индексы**:
- `(session_id, created_at)`

---

### 7. **contact_submissions** (0 записей)
Сообщения из контактной формы.

**Колонки**:
- `id` (uuid, PK)
- `name` (text) — имя
- `email` (text) — email
- `message` (text) — сообщение
- `language` (text) — язык
- `created_at` (timestamptz)

**RLS Политики**:
- ✅ Любой может отправить форму
- ✅ Только админ может читать

**Индексы**:
- `created_at DESC`

---

### 8. **admin_action_logs** (0 записей)
Журнал действий администраторов (audit trail).

**Колонки**:
- `id` (uuid, PK)
- `admin_id` (uuid) — ID администратора
- `action` (text) — действие (create/update/delete)
- `target_table` (text) — таблица
- `target_id` (uuid) — ID записи
- `payload` (jsonb) — данные действия
- `created_at` (timestamptz)

**RLS Политики**:
- ✅ Только админ может читать
- ✅ Service role может записывать

**Индексы**:
- `(admin_id, created_at DESC)`, `(target_table, target_id)`

---

## 🪣 Storage Buckets

### **media-public**
Публичное хранилище для медиафайлов.

**Настройки**:
- ✅ Публичный доступ: Да
- ✅ Лимит размера файла: 50 MB
- ✅ Разрешенные типы:
  - Изображения: JPEG, PNG, GIF, WebP, SVG
  - Видео: MP4, WebM
  - Аудио: MP3, WAV
  - Документы: PDF

**Политики**:
- ✅ Публичное чтение
- ✅ Админ может загружать
- ✅ Админ может удалять

---

## 🔧 Функции

### 1. **admin_retry_vector_job(job_id uuid)**
Перезапускает неудачную задачу индексации.

**Права**: Только админ  
**Возвращает**: Обновленную запись `vector_jobs`

### 2. **admin_enqueue_vector_job(content_id uuid, reason text)**
Ставит контент в очередь на индексацию для AI-поиска.

**Права**: Только админ  
**Возвращает**: Новую запись `vector_jobs`

### 3. **set_updated_at()**
Триггерная функция для автоматического обновления `updated_at`.

---

## 👤 Пользователи

### Администратор
- **Email**: `admin@zizishausen-volleyball.netlify.app`
- **ID**: `391cb1e5-9e34-4f01-8c3e-d11f659bc5ec`
- **Роль**: `admin` ✅
- **App Metadata**: `{"role": "admin", "provider": "email", "providers": ["email"]}`
- **User Metadata**: `{"role": "admin", "email_verified": true}`
- **Статус**: Email подтвержден ✅

---

## 🔐 Row Level Security (RLS)

Все таблицы защищены RLS политиками:

### Публичный доступ:
- ✅ Чтение опубликованного контента (`content_items`)
- ✅ Чтение медиафайлов (`media_assets`)
- ✅ Чтение связей контент-медиа (`content_media_links`)
- ✅ Отправка контактной формы (`contact_submissions`)

### Админ доступ:
- ✅ Полное управление контентом
- ✅ Полное управление медиа
- ✅ Чтение и управление vector jobs
- ✅ Чтение чатов и сообщений
- ✅ Чтение контактных форм
- ✅ Чтение логов действий

### Service Role:
- ✅ Управление чатами (для Edge Functions)
- ✅ Запись логов действий

---

## 📝 Миграции

Все миграции находятся в `/supabase/migrations/`:

1. ✅ `1762122873_enable_rls_contact_submissions.sql`
2. ✅ `1762129000_create_content_and_chat_schema.sql`
3. ✅ `1762129100_add_admin_rls_policies.sql`
4. ✅ `1762129200_add_admin_retry_function.sql`
5. ✅ `1762129300_admin_enqueue_vector_job.sql`
6. ✅ `1762130000_add_volleyball_rules_content.sql`
7. ✅ `1762130500_add_content_media_status_and_logs.sql`

---

## 🚀 Следующие шаги

### 1. Войдите в админку
Теперь вы можете войти в админку с учетными данными:
- **Email**: `admin@zizishausen-volleyball.netlify.app`
- **Пароль** задаётся владельцем через Supabase Auth и хранится в менеджере паролей.

### 2. Запустите индексацию контента
В админке (`/admin/content`) нажмите **"Ingest to AI search"** для каждой из 4 статей о правилах волейбола.

### 3. Загрузите медиафайлы
В админке (`/admin/media`) загрузите PDF с правилами и изображения.

---

## 📊 Статистика

| Таблица | Записей | RLS | Индексы |
|---------|---------|-----|---------|
| content_items | 4 | ✅ | 3 |
| media_assets | 0 | ✅ | 2 |
| content_media_links | 0 | ✅ | 1 |
| vector_jobs | 0 | ✅ | 2 |
| chat_sessions | 0 | ✅ | 2 |
| chat_messages | 0 | ✅ | 1 |
| contact_submissions | 0 | ✅ | 1 |
| admin_action_logs | 0 | ✅ | 2 |

**Всего**: 8 таблиц, 4 записи контента, 2 функции, 1 storage bucket

---

**Последнее обновление**: 9 ноября 2025, 13:00
