# Voice Assistant Orchestrator Workflow

Запускается командой `/voice_assistant`

## Полный процесс создания голосового ассистента

Этот workflow оркестрирует работу трёх агентов для создания голосового ассистента с Resemble Chatterbox:
1. **ARCHITECT** - проектирование архитектуры
2. **CODER** - реализация компонентов  
3. **REVIEWER** - проверка качества

## Шаг 1: Подготовка окружения

### Проверить зависимости:
```bash
# Убедиться что установлен Chatterbox
npm list @resembleai/chatterbox || npm install @resembleai/chatterbox

# Проверить environment переменные
echo "VITE_RESEMBLE_API_KEY=${VITE_RESEMBLE_API_KEY:-not_set}"
echo "VITE_RESEMBLE_VOICE_ID=${VITE_RESEMBLE_VOICE_ID:-not_set}"
```

### Создать директории:
```bash
mkdir -p docs/ai/voice-assistant
mkdir -p src/components/chatbot/voice/{VoiceAssistant,VoiceRecorder,VoiceProcessor,VoicePlayer,shared,hooks}
```

## Шаг 2: Запуск ARCHITECT агента

### Выполнить:
```
/voice_architect
```

### Ожидаемый результат:
- `docs/ai/voice-assistant/01_architecture.md` - архитектура
- `docs/ai/voice-assistant/02_api_contracts.md` - контракты  
- `docs/ai/voice-assistant/03_integration_guide.md` - руководство
- `docs/ai/voice-assistant/04_deployment.md` - деплоймент
- `docs/ai/voice-assistant/05_tasks.md` - план задач

### Проверить перед продолжением:
- [ ] Архитектура соответствует требованиям проекта
- [ ] Все контракты определены
- [ ] План задач реалистичный
- [ ] Интеграция с существующим чатботом продумана

## Шаг 3: Запуск CODER агента

### Выполнить:
```
/voice_coder
```

### Ожидаемый результат:
- Полная реализация voice компонентов
- Интеграция с существующим чатботом
- Базовые тесты
- TypeScript типы

### Проверить перед продолжением:
- [ ] Все компоненты созданы согласно AGENTS.md
- [ ] Код следует стандартам проекта
- [ ] Интеграция работает без ошибок
- [ ] Environment переменные настроены
- [ ] Базовые тесты проходят

## Шаг 4: Запуск REVIEWER агента

### Выполнить:
```
/voice_reviewer
```

### Ожидаемый результат:
- Детальный code review отчет
- Список critical/important/nice-to-have issues
- Security и performance анализ
- Accessibility проверка

### Проверить перед завершением:
- [ ] Нет critical security issues
- [ ] Performance требования выполнены
- [ ] Accessibility стандарты соблюдены
- [ ] Тест coverage достаточный
- [ ] Документация полная

## Шаг 5: Финализация и интеграция

### Обновить index файлы:
```typescript
// src/components/chatbot/index.ts
export * from './voice';

// Обновить главный chatbot компонент
import { VoiceAssistant } from './voice/VoiceAssistant';
```

### Добавить в package.json зависимости:
```json
{
  "dependencies": {
    "@resembleai/chatterbox": "^latest"
  }
}
```

### Обновить environment:
```bash
# .env.local
VITE_RESEMBLE_API_KEY=your_api_key_here
VITE_RESEMBLE_VOICE_ID=your_voice_id
```

## Шаг 6: Тестирование интеграции

### Запустить dev сервер:
```bash
npm run dev
```

### Проверить функциональность:
1. **Voice Recording:**
   - [ ] Микрофон permission работает
   - [ ] Audio visualizer показывает уровень
   - [ ] Start/stop recording корректно

2. **Voice Processing:**
   - [ ] Chatterbox API интеграция работает
   - [ ] Transcription точная
   - [ ] Error handling для API failures

3. **Voice Playback:**
   - [ ] Text-to-speech воспроизведение
   - [ ] Audio controls работают
   - [ ] Multi-language поддержка

4. **Chat Integration:**
   - [ ] Voice сообщения появляются в чате
   - [ ] Ответы от чатбота озвучиваются
   - [ ] State synchronization правильная

## Шаг 7: Production подготовка

### Build проверка:
```bash
npm run build
npm run preview
```

### Performance оптимизация:
- [ ] Bundle size анализ
- [ ] Lazy loading для voice компонентов
- [ ] Audio streaming оптимизация

### Security финальная проверка:
- [ ] API ключи в environment variables
- [ ] No hardcoded credentials
- [ ] Proper data cleanup

## Шаг 8: Документация и deployment

### Обновить README:
```markdown
## Voice Assistant

Проект включает голосового ассистента на базе Resemble Chatterbox.

### Setup:
1. Установить @resembleai/chatterbox
2. Добавить VITE_RESEMBLE_API_KEY в .env.local
3. Использовать VoiceAssistant компонент

### Usage:
```tsx
<VoiceAssistant 
  config={voiceConfig}
  onMessage={handleVoiceMessage}
/>
```

### Features:
- Голосовой ввод через микрофон
- Speech-to-text с Chatterbox
- Text-to-speech воспроизведение
- Multi-language поддержка
- Accessibility compliant
```

### Deployment checklist:
- [ ] Environment переменные настроены
- [ ] Build проходит без ошибок
- [ ] Voice functionality работает в production
- [ ] Error monitoring настроен
- [ ] Performance метрики собираются

## Траблшутинг чеклист

### Частые проблемы:
1. **Microphone permission denied**
   - Проверить HTTPS в production
   - Добавить user permission prompt

2. **Chatterbox API errors**
   - Проверить API ключ validity
   - Проверить network connectivity

3. **Audio playback issues**
   - Проверить browser compatibility
   - Добавить fallback TTS

4. **Performance issues**
   - Оптимизировать audio processing
   - Добавить Web Workers

## Успешное завершение criteria

### Функциональные требования:
- [ ] Voice recording работает
- [ ] Speech-to-text точность > 90%
- [ ] Text-to-speech качество приемлемое
- [ ] Интеграция с чатботом seamless

### Нефункциональные требования:
- [ ] Response time < 2 seconds
- [ ] Memory usage < 50MB
- [ ] Browser compatibility: Chrome, Firefox, Safari
- [ ] Mobile responsiveness

### Quality requirements:
- [ ] Test coverage > 80%
- [ ] Security scan clean
- [ ] Accessibility AA compliant
- [ ] Performance grade A

## Результат выполнения

После успешного прохождения всех этапов у тебя будет:
1. **Полноценный голосовой ассистент** интегрированный в чатбот
2. **Масштабируемая архитектура** готовая к расширению
3. **Качественный код** прошедший ревью
4. **Полная документация** для поддержки и развития
5. **Production-ready** решение с учетом security и performance

## Следующие шаги после реализации

1. **User testing** - собрать feedback от пользователей
2. **Analytics** - добавить метрики использования voice
3. **Enhancements** - voice commands, custom voices
4. **Optimization** - кэширование, offline режим
5. **Scaling** - поддержка других языков, voice personas

---

**Готов к запуску!** Выполняй `/voice_assistant` и следуй шагам последовательно.
