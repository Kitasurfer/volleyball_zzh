# Voice Assistant Architect Workflow

Запускается командой `/voice_architect`

## Роль ARCHITECT
Ты - архитектор голосового ассистента для volleyball проекта. Твоя задача - спроектировать масштабируемую и безопасную архитектуру для голосового AI чата с Resemble Chatterbox.

## Шаг 1: Анализ требований

### Функциональные требования:
- Голосовой ввод через микрофон
- Обработка речи через локальный Chatterbox Service (Python FastAPI)
- Воспроизведение ответов текстом в речь через Chatterbox
- Интеграция с существующим чатботом
- Поддержка 4 языков: немецкий, английский, русский, итальянский
- **ПОЛНОСТЬЮ БЕСПЛАТНОЕ РЕШЕНИЕ** - без платных API

### Нефункциональные требования:
- Задержка < 2 секунд для ответа
- Поддержка мобильных устройств
- Offline fallback для базовых функций
- Соответствие GDPR для voice данных

## Шаг 2: Архитектурный анализ

### Изучить текущую структуру:
1. Проанализируй `src/components/chatbot/`
2. Проверь существующий `VoiceInputButton.tsx`
3. Изучи `src/lib/LanguageContext.tsx`
4. Просмотри `src/hooks/` для паттернов

### Определить точки интеграции:
- Где подключить VoiceAssistant к существующему чату
- Как интегрироваться с системой сообщений
- Где хранить настройки голоса
- Как обрабатывать ошибки в контексте чата

## Шаг 3: Проектирование архитектуры

### Компонентная структура:
```
src/components/chatbot/voice/
├── ui/
│   ├── VoiceAssistant/
│   │   ├── index.tsx
│   │   └── VoiceAssistant.tsx
│   ├── VoiceRecorder/
│   │   ├── index.tsx
│   │   ├── VoiceRecorder.tsx
│   │   └── AudioVisualizer.tsx
│   └── VoicePlayer/
│       ├── index.tsx
│       ├── VoicePlayer.tsx
│       └── AudioControls.tsx
├── hooks/
│   ├── useAudioRecording.ts
│   ├── useVoiceProcessing.ts
│   └── useTextToSpeech.ts
├── api/
│   ├── VoiceApiClient.ts
│   └── voiceApi.types.ts
├── types/
│   └── voice.types.ts
├── lib/
│   ├── constants.ts
│   └── utils.ts
└── index.ts

chatterbox-service/
├── main.py              # FastAPI сервер с Chatterbox
├── requirements.txt     # Python зависимости
└── Dockerfile          # Docker контейнер для деплоя
```

### API контракты:
```typescript
// Frontend API contracts
interface VoiceConfig {
  language: 'de' | 'en' | 'ru' | 'it';
  pitch: number;
  rate: number;
  voiceId: string;
}

interface VoiceMessage {
  id: string;
  transcript?: string;
  isProcessing: boolean;
  error?: string;
  timestamp: Date;
}

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  audioLevel: number;
  permissions: {
    microphone: 'granted' | 'denied' | 'prompt';
  };
}

// Backend API endpoints (Chatterbox Service)
interface VoiceApiEndpoints {
  'POST /chatterbox-service/tts': {
    request: { text: string; language: string; voice_id: string };
    response: { audio_data: string; sample_rate: number; success: boolean; message: string };
    errors: 'model_not_loaded' | 'unsupported_language' | 'text_too_long' | 'generation_failed';
  };
  
  // Speech-to-Text через Web Speech API (бесплатный fallback)
  'BROWSER WebSpeechAPI': {
    request: AudioBlob;
    response: { transcript: string; confidence: number };
    errors: 'not_supported' | 'permission_denied' | 'no_speech_detected';
  };
}
```

### Security Architecture:
```typescript
// ❌ НЕПРАВИЛЬНО: API ключи на фронтенде
// VITE_CHATTERBOX_API_KEY=secret

// ✅ ПРАВИЛЬНО: Локальный Chatterbox Service без API ключей
// chatterbox-service/main.py - локальный Python сервис
// chatterbox-service/Dockerfile - контейнер для деплоя
// НИКАКИХ API КЛЮЧЕЙ НУЖНО - Chatterbox open-source
```

### Privacy & Consent Requirements:
```typescript
// User Consent UX Flow
interface ConsentFlow {
  // Перед первым использованием микрофона
  firstUsePrompt: {
    title: "Голосовой ввод чатбота";
    message: "Мы используем микрофон для распознавания голоса. Ваши голосовые данные обрабатываются безопасно.";
    action: "Разрешить использование микрофона";
    storage: "consent_given_timestamp в localStorage";
  };
  
  // GDPR compliance - зависит от политики продукта
  gdprCompliance: {
    // Безопасный путь по умолчанию:
    required: true; // явное согласие для отправки в облако
    label: "Я согласен на обработку голосовых данных в облаке";
    storage: "gdpr_consent в localStorage";
    
    // Без согласия:
    withoutConsent: {
      allowLocalRecording: false, // безопасный путь - отключаем
      allowCloudProcessing: false, // без отправки на сервер
      fallback: "только текстовый ввод";
    };
  };
  
  // Privacy в логах
  logging: {
    transcript: "маскировать или не логировать полностью",
    audioData: "никогда не логировать audio blobs",
    errors: "логировать только типы ошибок";
  };
}
```

## Шаг 4: Создание документации

### Создать файлы:
1. `docs/ai/voice-assistant/01_architecture.md` - детальная архитектура
2. `docs/ai/voice-assistant/02_api_contracts.md` - контракты и типы
3. `docs/ai/voice-assistant/03_integration_guide.md` - руководство по интеграции
4. `docs/ai/voice-assistant/04_deployment.md` - настройки для продакшена
5. `docs/ai/voice-assistant/05_tasks.md` - план задач с Definition of Done

### Содержание архитектуры:
- Диаграмма компонентов и потоков данных
- Список зависимостей и их версии
- Security considerations (server-side proxy)
- Performance requirements
- Browser compatibility matrix
- Fallback стратегия (Web Speech API)

## Шаг 5: Планирование задач с Definition of Done

### Создать `docs/ai/voice-assistant/05_tasks.md` с задачами:

**Phase 1: Core Infrastructure**
- [ ] **VoiceApiClient** - HTTP клиент для Supabase Edge Functions
  - **Done:** supabase.functions.invoke('voice-transcribe') и supabase.functions.invoke('voice-tts') работают
  - **Done:** Error handling для всех response кодов
  - **Done:** Timeout 30 секунд, retry 2 раза
  
- [ ] **useAudioRecording hook** - запись аудио
  - **Done:** startRecording() запускает MediaRecorder
  - **Done:** stopRecording(): Promise<Blob> возвращает аудио
  - **Done:** Proper cleanup stream tracks
  - **Done:** Permission handling (granted/denied/prompt)
  
- [ ] **Базовые типы и интерфейсы**
  - **Done:** Все voice types в types/voice.types.ts
  - **Done:** API контракты в api/voiceApi.types.ts
  - **Done:** Константы в lib/constants.ts

**Phase 2: UI Components**
- [ ] **VoiceRecorder компонент** - UI для записи
  - **Done:** Кнопка record/stop с правильными состояниями
  - **Done:** AudioVisualizer показывает уровень аудио
  - **Done:** Accessibility (ARIA labels, keyboard nav)
  - **Done:** Error states и loading indicators
  
- [ ] **VoicePlayer компонент** - воспроизведение TTS
  - **Done:** Воспроизведение audio blob от API
  - **Done:** Audio controls (play/pause/stop/volume)
  - **Done:** Fallback на Web Speech API если API недоступен
  
- [ ] **VoiceAssistant главный компонент**
  - **Done:** Интеграция с существующим чатботом
  - **Done:** State management для recording/processing
  - **Done:** Обработка ошибок и retry логика

**Phase 3: Backend Integration**
- [ ] **Chatterbox Service (Python FastAPI)**
  - **Done:** chatterbox-service/main.py с Chatterbox TTS
  - **Done:** chatterbox-service/requirements.txt с зависимостями
  - **Done:** chatterbox-service/Dockerfile для деплоя
  - **Done:** Health check endpoint и error handling
  
- [ ] **Speech-to-Text через Web Speech API**
  - **Done:** useSpeechRecognition hook для браузерного STT
  - **Done:** Fallback на текстовый ввод если не поддерживается
  - **Done:** Обработка ошибок распознавания

**Phase 4: Advanced Features**
- [ ] **Multi-language поддержка**
  - **Done:** Переключение языков в реальном времени
  - **Done:** Локализация UI сообщений об ошибках
  - **Done:** Voice ID настройки для каждого языка
  
- [ ] **Voice settings panel**
  - **Done:** Настройки pitch/rate/voice ID
  - **Done:** Сохранение в localStorage
  - **Done:** Reset to defaults функциональность

**Phase 5: Testing & Polish**
- [ ] **Unit тесты**
  - **Done:** useAudioRecording hook тесты
  - **Done:** VoiceApiClient тесты с моками
  - **Done:** Component rendering тесты
  
- [ ] **Integration тесты**
  - **Done:** Voice flow end-to-end с моками API
  - **Done:** Error handling сценарии
  - **Done:** Browser compatibility тесты
  
- [ ] **E2E тесты**
  - **Done:** Recording → Processing → Response flow
  - **Done:** Mobile device тестирование
  - **Done:** Accessibility тестирование

## Шаг 7: Handoff to CODER

### CODER Входные данные:
**Документация готова:**
- [ ] `docs/ai/voice-assistant/01_architecture.md` - архитектура и компоненты
- [ ] `docs/ai/voice-assistant/02_api_contracts.md` - API контракты и форматы
- [ ] `docs/ai/voice-assistant/05_tasks.md` - задачи с Definition of Done

**Структура для создания:**
```
src/components/chatbot/voice/
├── ui/VoiceAssistant/
├── ui/VoiceRecorder/
├── ui/VoicePlayer/
├── hooks/
├── api/
├── types/
├── lib/
└── index.ts
```

**Минимальный вертикальный срез для первого PR:**
1. **Core Infrastructure:**
   - `types/voice.types.ts` - базовые типы
   - `hooks/useAudioRecording.ts` - запись аудио
   - `api/VoiceApiClient.ts` - HTTP клиент

2. **Basic UI:**
   - `ui/VoiceRecorder/VoiceRecorder.tsx` - кнопка записи
   - `ui/VoiceAssistant/VoiceAssistant.tsx` - основной контейнер

3. **Backend:**
   - `chatterbox-service/main.py` - Python FastAPI сервис
   - `chatterbox-service/requirements.txt` - зависимости
   - `chatterbox-service/Dockerfile` - контейнер

**Pre-check перед запуском CODER:**
- [ ] Все API контракты определены и реалистичны
- [ ] Структура папок согласована с AGENTS.md
- [ ] Security требования учтены (server-side proxy)
- [ ] Definition of Done детализированы для каждой задачи
- [ ] Consent UX требования определены

## Шаг 8: Валидация архитектуры

### Проверить:
- [ ] Масштабируемость для будущих voice фич
- [ ] Совместимость с текущей архитектурой чатбота
- [ ] Security и privacy compliance
- [ ] Performance характеристики
- [ ] Browser поддержка
- [ ] Mobile оптимизация

### Выходные документы:
- Архитектурная диаграмма
- API контракты
- План задач с приоритетами
- Риски и митигации
- Технические требования

## Финальный результат
ARCHITECT должен создать полную архитектурную документацию и план реализации, готовый для передачи CODER агенту.
