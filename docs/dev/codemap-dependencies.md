# Code Map - Dependencies Graph

## 🔗 Граф зависимостей модулей

### Frontend зависимости
```mermaid
graph TD
    subgraph "Entry Points"
        A[main.tsx] --> B[App.tsx]
    end
    
    subgraph "Core Providers"
        B --> C[AppProviders.tsx]
        C --> D[QueryClientProvider]
        C --> E[AuthProvider]
        C --> F[LanguageProvider]
        C --> G[HelmetProvider]
    end
    
    subgraph "Routing"
        B --> H[AppRoutes.tsx]
        H --> I[React Router]
        H --> J[Pages]
        H --> K[Admin Routes]
    end
    
    subgraph "Pages"
        J --> L[HomePage]
        J --> M[AboutPage]
        J --> N[GalleryPage]
        J --> O[TrainingPage]
        J --> P[CompetitionsPage]
        J --> Q[ContactPage]
        J --> R[HallPage]
        J --> S[BeachPage]
        
        K --> T[AdminOverviewPage]
        K --> U[AdminContentPage]
        K --> V[AdminMediaPage]
        K --> W[AdminAlbumsPage]
        K --> X[AdminVectorJobsPage]
        K --> Y[AdminChatsPage]
    end
    
    subgraph "Components"
        L --> Z[Header]
        L --> AA[Footer]
        L --> BB[GalleryGrid]
        N --> CC[GalleryFilters]
        N --> DD[GalleryLightbox]
        N --> EE[GalleryAlbumGrid]
        B --> FF[Chatbot]
        B --> GG[CookieConsent]
        B --> HH[ScrollToTop]
    end
    
    subgraph "Libraries & Utils"
        E --> II[supabase.ts]
        D --> JJ[queryClient.ts]
        F --> KK[translations.ts]
        L --> LL[schedule.ts]
        FF --> MM[teamNaming.ts]
    end
    
    subgraph "Types"
        NN[index.ts]
        OO[admin.ts]
        PP[chatbot.ts]
        QQ[standings.ts]
        RR[speech.d.ts]
    end
```

### Backend зависимости (Edge Functions)
```mermaid
graph TD
    subgraph "Chatbot Function"
        A[index.ts] --> B[router.ts]
        B --> C[rag.ts]
        B --> D[weather.ts]
        C --> E[clients.ts]
        C --> F[prompts.ts]
        C --> G[utils.ts]
        E --> H[qdrant.ts]
        E --> I[supabase client]
        F --> J[substitutions.ts]
        A --> K[types.ts]
        A --> L[config.ts]
    end
    
    subgraph "Ingest Content Function"
        M[index.ts] --> N[jobs.ts]
        M --> O[chunks.ts]
        N --> P[clients.ts]
        P --> Q[qdrant.ts]
        P --> R[supabase client]
        M --> S[types.ts]
        M --> T[config.ts]
    end
    
    subgraph "League Results Function"
        U[index.ts] --> V[api.ts]
        V --> W[VLW API]
        U --> X[types.ts]
    end
    
    subgraph "Process Document Function"
        Y[index.ts] --> Z[docling.ts]
        Y --> AA[content.ts]
        Y --> BB[jobs.ts]
        Y --> CC[storage.ts]
        Z --> DD[Docling Service]
        AA --> EE[PDF Processing]
        BB --> FF[Queue System]
        CC --> GG[Supabase Storage]
        Y --> HH[types.ts]
        Y --> II[config.ts]
    end
```

## 📦 Пакетные зависимости

### Core Dependencies
```mermaid
graph LR
    subgraph "React Ecosystem"
        A[react] --> B[react-dom]
        A --> C[react-router-dom]
        A --> D[react-helmet-async]
        A --> E[@tanstack/react-query]
    end
    
    subgraph "UI & Styling"
        F[tailwindcss] --> G[autoprefixer]
        F --> H[postcss]
        I[lucide-react] --> J[clsx]
        I --> K[tailwind-merge]
    end
    
    subgraph "Backend Clients"
        L[@supabase/supabase-js] --> M[@supabase/auth-helpers-react]
        N[qdrant-js] --> O[axios]
        P[docling] --> Q[python service]
    end
```

### Dev Dependencies
```mermaid
graph LR
    subgraph "Build Tools"
        A[vite] --> B[@vitejs/plugin-react]
        A --> C[typescript]
        A --> D[eslint]
        A --> E[postcss]
    end
    
    subgraph "Testing"
        F[vitest] --> G[@testing-library/react]
        F --> H[@testing-library/jest-dom]
    end
    
    subgraph "Code Quality"
        I[eslint] --> J[@typescript-eslint/eslint-plugin]
        I --> K[eslint-plugin-react-hooks]
        I --> L[eslint-plugin-react-refresh]
    end
```

## 🔄 Потоки данных между сервисами

```mermaid
sequenceDiagram
    participant Frontend as React App
    participant Supabase as Supabase DB
    participant Qdrant as Vector DB
    participant VLW as VLW API
    participant Docling as Docling Service
    
    Frontend->>Supabase: CRUD операции
    Frontend->>Qdrant: Поиск документов (через Edge Function)
    Frontend->>VLW: Данные лиги (через Edge Function)
    Frontend->>Docling: Обработка документов (через Edge Function)
    
    Supabase->>Qdrant: Синхронизация метаданных
    Docling->>Qdrant: Векторизация контента
    VLW->>Supabase: Кэширование результатов
```

## 🎯 Критические пути зависимостей

### 1. Аутентификация
```mermaid
graph LR
    A[AuthProvider] --> B[supabase.ts]
    B --> C[Supabase Auth]
    C --> D[AdminRouteGuard]
    D --> E[Admin Pages]
```

### 2. Чат-бот RAG
```mermaid
graph LR
    A[Chatbot Component] --> B[chatbot Edge Function]
    B --> C[Qdrant Search]
    B --> D[Supabase Chat History]
    B --> E[OpenAI API]
```

### 3. Галерея
```mermaid
graph LR
    A[GalleryPage] --> B[GalleryGrid]
    B --> C[GalleryFilters]
    B --> D[GalleryLightbox]
    A --> E[Supabase Storage]
```

## ⚠️ Потенциальные проблемы зависимостей

### Циклические зависимости
- **Отсутствуют** - проект спроектирован с однонаправленными зависимостями

### Сильная связанность
- **App.tsx** → множество компонентов (нормально для корневого компонента)
- **AdminRouteGuard** → конкретные админ страницы (нормально для безопасности)

### Слабые места
- **Edge Functions** → внешние API (VLW, Docling) - требует обработки ошибок
- **Qdrant клиент** → зависимость от внешней службы - нужен fallback

## 🔧 Оптимизация зависимостей

### Code Splitting
```mermaid
graph LR
    A[AppRoutes] --> B[Lazy Loading]
    B --> C[Admin Pages]
    B --> D[Gallery Components]
    B --> E[Chatbot]
```

### Tree Shaking
```mermaid
graph LR
    A[Unused imports] --> B[Bundler removal]
    C[Dead code] --> B
    D[Unused utils] --> B
```

### Caching Strategy
```mermaid
graph LR
    A[React Query] --> B[Server State Cache]
    C[Browser Cache] --> D[Static Assets]
    E[CDN Cache] --> D
```

---

*Сгенерировано автоматически для анализа зависимостей проекта*
