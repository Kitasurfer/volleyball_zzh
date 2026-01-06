# Code Map - Volleyball ZZH Project Architecture

## 🏗️ Общая архитектура проекта

```mermaid
graph TB
    subgraph "Frontend (React)"
        A[main.tsx] --> B[App.tsx]
        B --> C[AppProviders.tsx]
        B --> D[AppRoutes.tsx]
        C --> E[QueryClient]
        C --> F[AuthProvider]
        C --> G[LanguageProvider]
        D --> H[Pages]
        D --> I[Admin Routes]
    end
    
    subgraph "Pages Layer"
        H --> H1[HomePage]
        H --> H2[AboutPage]
        H --> H3[GalleryPage]
        H --> H4[TrainingPage]
        H --> H5[CompetitionsPage]
        I --> I1[AdminOverviewPage]
        I --> I2[AdminContentPage]
        I --> I3[AdminMediaPage]
    end
    
    subgraph "Backend Services"
        J[Supabase Edge Functions]
        J --> J1[chatbot]
        J --> J2[ingest-content]
        J --> J3[league-results]
        J --> J4[process-document]
    end
    
    subgraph "External APIs"
        K[VLW API]
        L[Qdrant Vector DB]
        M[Supabase DB]
        N[Docling Service]
    end
    
    J1 --> L
    J1 --> M
    J2 --> L
    J2 --> M
    J3 --> K
    J4 --> N
    J4 --> M
```

## 📁 Структура директорий

### Frontend (`src/`)
```
src/
├── components/          # UI компоненты
│   ├── admin/          # Админ-панель компоненты
│   ├── gallery/        # Галерея компоненты
│   └── ui/             # Базовые UI элементы
├── pages/              # Страницы приложения
│   └── admin/          # Админ-страницы
├── lib/                # Утилиты и контексты
├── routes/             # Роутинг
├── types/              # TypeScript типы
└── data/               # Статические данные
```

### Backend (`supabase/functions/`)
```
supabase/functions/
├── chatbot/            # AI чат-бот с RAG
├── ingest-content/     # Обработка контента
├── league-results/     # Результаты лиги (VLW API)
└── process-document/   # Обработка документов
```

## 🔄 Потоки данных

### 1. Пользовательский интерфейс
```mermaid
sequenceDiagram
    participant U as User
    participant P as Pages
    participant C as Components
    participant L as Lib/Contexts
    
    U->>P: Навигация
    P->>C: Рендер компонентов
    C->>L: Запрос данных
    L->>C: Данные/состояние
    C->>P: Обновление UI
    P->>U: Отображение
```

### 2. Чат-бот с RAG
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant CB as Chatbot Function
    participant Q as Qdrant
    participant S as Supabase
    
    U->>F: Сообщение
    F->>CB: API запрос
    CB->>Q: Поиск векторов
    Q->>CB: Релевантные документы
    CB->>S: История чата
    CB->>CB: Генерация ответа
    CB->>F: Ответ
    F->>U: Отображение
```

### 3. Обработка контента
```mermaid
sequenceDiagram
    participant A as Admin
    participant IC as Ingest Content
    participant PD as Process Document
    participant Q as Qdrant
    participant S as Supabase
    
    A->>IC: Загрузка документа
    IC->>PD: Обработка
    PD->>PD: Извлечение текста
    PD->>PD: Чанкинг
    PD->>Q: Векторизация
    Q->>S: Сохранение метаданных
    S->>A: Статус обработки
```

## 🎯 Ключевые зависимости

### Frontend зависимости
- **React 18** - UI фреймворк
- **React Router** - Навигация
- **TanStack Query** - Управление состоянием сервера
- **Supabase JS** - Клиент Supabase
- **TailwindCSS** - Стили

### Backend зависимости
- **Supabase Edge Runtime** - Serverless функции
- **Qdrant Client** - Векторная база данных
- **Docling** - Обработка документов
- **VLW API** - Данные волейбольной лиги

## 🔐 Архитектура безопасности

```mermaid
graph LR
    subgraph "Frontend"
        A[AuthProvider]
        B[AdminRouteGuard]
    end
    
    subgraph "Backend"
        C[JWT Validation]
        D[RLS Policies]
        E[Edge Functions]
    end
    
    A --> C
    B --> C
    C --> D
    E --> D
```

## 📊 Административная панель

### Модули админки:
- **Overview** - Общая статистика
- **Content** - Управление контентом
- **Media** - Медиа файлы
- **Albums** - Фотоальбомы
- **Vector Jobs** - Задачи векторизации
- **Chats** - История чатов

## 🚀 Деплоймент и инфраструктура

```mermaid
graph TB
    subgraph "Development"
        A[Local Dev Server]
        B[Supabase Local]
    end
    
    subgraph "Production"
        C[Netlify]
        D[Supabase Production]
        E[Qdrant Cloud]
    end
    
    A --> C
    B --> D
    D --> E
```

## 🔧 Конфигурация

### Переменные окружения:
- `VITE_SUPABASE_URL` - URL Supabase
- `VITE_SUPABASE_ANON_KEY` - Анонимный ключ
- `VLW_API_KEY` - API ключ волейбольной лиги
- `QDRANT_URL` - URL векторной БД

## 📈 Масштабирование

### Горизонтальное масштабирование:
- **Edge Functions** - Автоматическое масштабирование
- **CDN** - Статические ресурсы
- **Database Pooling** - Подключения к БД

### Вертикальное масштабирование:
- **Code Splitting** - Ленивая загрузка
- **Caching** - React Query кэш
- **Vector Search Optimization** - Индексация Qdrant

---

*Сгенерировано автоматически для анализа архитектуры проекта*
