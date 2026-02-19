# Voice Assistant Implementation Tasks

## Definition of Done

Каждая задача считается выполненной когда:
- ✅ Код написан и следует архитектуре
- ✅ TypeScript типы строгие и полные
- ✅ Error handling реализован
- ✅ Компонент протестирован вручную
- ✅ Accessibility (ARIA labels, keyboard nav)
- ✅ Локализация для 4 языков (de, en, ru, it)

---

## Phase 1: Core Infrastructure

### 1.1 Базовые типы и интерфейсы
**Файл:** `src/components/chatbot/voice/types/voice.types.ts`
- [ ] **Language type** - унаследовать из проекта `src/types/index.ts`
- [ ] **VoiceConfig interface** - язык, pitch, rate, voiceId
- [ ] **VoiceState interface** - recording, processing, transcript, audioLevel
- [ ] **VoiceMessage interface** - id, transcript, isProcessing, error, timestamp
- [ ] **UseAudioRecording options/return types**

**Done Criteria:**
```typescript
type Language = 'de' | 'en' | 'ru' | 'it';

interface VoiceConfig {
  language: Language;
  pitch: number;
  rate: number;
  voiceId: string;
}
```

### 1.2 API клиент для Chatterbox Service
**Файл:** `src/components/chatbot/voice/api/VoiceApiClient.ts`
- [ ] **IVoiceApiClient interface** - только TTS метод
- [ ] **VoiceApiClient class** - HTTP клиент для localhost:8000
- [ ] **Error handling** - маппинг HTTP статусов в VoiceApiError
- [ ] **Base64 конвертация** - audio_data в Blob
- [ ] **Type guards** для проверки ошибок

**Done Criteria:**
```typescript
const client = new VoiceApiClient();
const audio = await client.synthesizeSpeech('Hello', 'de');
// audio instanceof Blob === true
```

### 1.3 API типы
**Файл:** `src/components/chatbot/voice/api/voiceApi.types.ts`
- [ ] **VoiceApiError class** - наследует Error с кодами ошибок
- [ ] **VoiceTtsResponse interface** - audioBlob, sampleRate, success, message
- [ ] **SpeechRecognition types** - для Web Speech API
- [ ] **Error code enums** - model_not_loaded, unsupported_language, etc.

### 1.4 Константы и утилиты
**Файл:** `src/components/chatbot/voice/lib/constants.ts`
- [ ] **DEFAULT_VOICE_CONFIG** - язык='de', pitch=1.0, rate=1.0
- [ ] **MAX_AUDIO_DURATION** - 30 секунд
- [ ] **MAX_AUDIO_SIZE** - 25MB
- [ ] **SUPPORTED_LANGUAGES** - массив с 'de', 'en', 'ru', 'it'

**Файл:** `src/components/chatbot/voice/lib/utils.ts`
- [ ] **getVoiceUiText()** - локализация UI строк для 4 языков
- [ ] **formatDuration()** - секунды в MM:SS
- [ ] **getAudioLevel()** - нормализация уровня аудио
- [ ] **isBrowserSupported()** - проверка MediaRecorder API
- [ ] **getMicrophoneErrorMessage()** - локализация ошибок микрофона

---

## Phase 2: Audio Recording Hooks

### 2.1 useAudioRecording Hook
**Файл:** `src/components/chatbot/voice/hooks/useAudioRecording.ts`
- [ ] **MediaRecorder integration** - start/stop/pause
- [ ] **Audio level monitoring** - Web Audio API analyser
- [ ] **Permission handling** - granted/denied/prompt states
- [ ] **Blob generation** - правильный MIME type (audio/webm)
- [ ] **Cleanup logic** - stop tracks, close context
- [ ] **Auto-stop** - по duration/size limits

**Done Criteria:**
```typescript
const { state, startRecording, stopRecording } = useAudioRecording({
  maxDuration: 30,
  onAudioLevel: (level) => console.log(level)
});

await startRecording(); // Promise<void>
const blob = await stopRecording(); // Promise<Blob>
```

### 2.2 useSpeechRecognition Hook
**Файл:** `src/components/chatbot/voice/hooks/useSpeechRecognition.ts`
- [ ] **Web Speech API wrapper** - webkitSpeechRecognition
- [ ] **Language switching** - de-DE, en-US, ru-RU, it-IT
- [ ] **Error handling** - not-allowed, no-speech, network
- [ ] **Result processing** - transcript + confidence
- [ ] **Fallback detection** - если API не поддерживается

**Done Criteria:**
```typescript
const { isListening, transcript, error, startListening } = useSpeechRecognition('de');
startListening(); // Начинает распознавание
```

---

## Phase 3: UI Components

### 3.1 VoiceRecorder Component
**Файлы:** `src/components/chatbot/voice/ui/VoiceRecorder/`
- [ ] **VoiceRecorder.tsx** - главный компонент записи
- [ ] **AudioVisualizer.tsx** - визуализация уровня аудио
- [ ] **index.tsx** - barrel export

**Done Criteria:**
- ✅ Кнопка record/stop с правильными состояниями
- ✅ AudioVisualizer показывает уровень в real-time
- ✅ Accessibility: ARIA labels, keyboard navigation
- ✅ Error states и loading indicators
- ✅ Локализация всех UI строк

### 3.2 VoicePlayer Component
**Файлы:** `src/components/chatbot/voice/ui/VoicePlayer/`
- [ ] **VoicePlayer.tsx** - воспроизведение TTS аудио
- [ ] **AudioControls.tsx** - play/pause/volume controls
- [ ] **index.tsx** - barrel export

**Done Criteria:**
- ✅ Воспроизведение audio blob от Chatterbox
- ✅ Audio controls (play/pause/stop/volume)
- ✅ Автовоспроизведение если нужно
- ✅ Proper cleanup URL.createObjectURL
- ✅ Error handling для аудио ошибок

### 3.3 VoiceAssistant Component
**Файлы:** `src/components/chatbot/voice/ui/VoiceAssistant/`
- [ ] **VoiceAssistant.tsx** - главный контейнер
- [ ] **index.tsx** - barrel export

**Done Criteria:**
- ✅ Интеграция с существующим чатботом
- ✅ State management для recording/processing
- ✅ Обработка ошибок и retry логика
- ✅ Локализация для 4 языков
- ✅ Props interface для конфигурации

---

## Phase 4: Backend Service

### 4.1 Chatterbox Service (Python FastAPI)
**Файлы:** `chatterbox-service/`
- [ ] **main.py** - FastAPI сервер с Chatterbox TTS
- [ ] **requirements.txt** - Python зависимости
- [ ] **Dockerfile** - контейнер для деплоя

**Done Criteria:**
```python
# Запуск сервиса
cd chatterbox-service
pip install -r requirements.txt
python main.py

# Health check
curl http://localhost:8000/health
# {"status": "healthy", "model_loaded": true}

# TTS endpoint
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "language": "en"}'
```

### 4.2 Chatterbox Integration
- [ ] **ChatterboxMultilingualTTS** - загрузка модели
- [ ] **Multi-language support** - de, en, ru, it
- [ ] **Base64 audio encoding** - для передачи во фронтенд
- [ ] **Error handling** - model not loaded, generation failed
- [ ] **Health check endpoint** - статус модели

---

## Phase 5: Integration & Testing

### 5.1 Integration с Chatbot
**Файл:** Интеграция в существующий `src/components/chatbot/Chatbot.tsx`
- [ ] **VoiceAssistant импорт** - подключить компонент
- [ ] **LanguageContext integration** - использовать текущий язык
- [ ] **Message handling** - onMessage callback для транскриптов
- [ ] **UI positioning** - разместить в интерфейсе чата
- [ ] **Settings panel** - настройки голоса если нужно

### 5.2 Manual Testing Checklist
- [ ] **Recording flow** - микрофон работает, визуализация показывает уровень
- [ ] **Speech recognition** - распознает речь на 4 языках
- [ ] **TTS generation** - Chatterbox создает аудио
- [ ] **Audio playback** - воспроизведение работает
- [ ] **Error handling** - ошибки показываются пользователю
- [ ] **Language switching** - смена языка работает
- [ ] **Mobile compatibility** - работает на мобильных устройствах
- [ ] **Accessibility** - keyboard navigation, screen readers

### 5.3 Performance Testing
- [ ] **Latency measurement** - TTS генерация < 2s
- [ ] **Memory usage** - нет утечек памяти
- [ ] **Audio quality** - чистое аудио без артефактов
- [ ] **Browser compatibility** - Chrome, Safari, Firefox, Edge

---

## Phase 6: Documentation & Deployment

### 6.1 Documentation
- [ ] **README.md** - установка и использование
- [ ] **API documentation** - контракты обновлены
- [ ] **Deployment guide** - запуск Chatterbox сервиса
- [ ] **Troubleshooting** - частые проблемы

### 6.2 Deployment
- [ ] **Docker build** - образ для Chatterbox сервиса
- [ ] **Environment setup** - переменные окружения
- [ ] **Production testing** - работа в продакшене
- [ ] **Monitoring setup** - логирование и health checks

---

## Priority Order

1. **Phase 1** - Core Infrastructure (типы, API клиент, утилиты)
2. **Phase 2** - Audio Recording Hooks (useAudioRecording, useSpeechRecognition)
3. **Phase 3** - UI Components (VoiceRecorder, VoicePlayer, VoiceAssistant)
4. **Phase 4** - Backend Service (Chatterbox FastAPI)
5. **Phase 5** - Integration & Testing
6. **Phase 6** - Documentation & Deployment

## Success Metrics

- ✅ **Functional**: Голосовой ввод работает на 4 языках
- ✅ **Performance**: TTS генерация < 2 секунд
- ✅ **Quality**: Чистое аудио без артефактов
- ✅ **Compatibility**: Работает на всех современных браузерах
- ✅ **Accessibility**: Полная поддержка keyboard navigation
- ✅ **Free**: Никаких платных API ключей не требуется
