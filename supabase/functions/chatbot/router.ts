// Router Agent - анализирует запрос и обогащает промпт для LLM
// НЕ даёт готовых ответов - только контекст и инструкции для умного ответа
import { generateCerebrasChat } from './clients.ts';
import { getCerebrasConfig } from './config.ts';
import { getWeatherForecast, formatWeatherResponse, type WeatherForecast } from './weather.ts';

export interface RouterResult {
  originalQuestion: string;
  enrichedQuestion: string;        // Обогащённый вопрос для поиска в базе знаний
  questionType: 'location' | 'schedule' | 'rules' | 'weather' | 'contact' | 'general';
  needsKnowledgeBase: boolean;
  context: string;                 // Контекст для LLM - что учитывать при ответе
  instructions: string;            // Инструкции для LLM - как отвечать
  isAmbiguous: boolean;            // Вопрос неоднозначный (пляжный/классический)?
  directAnswer?: string;           // Только для погоды (реальные данные API)
  weatherData?: WeatherForecast;
}

// История сообщений для анализа контекста
export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Главная функция роутера - анализирует вопрос с учётом истории чата
export async function routeQuestion(
  question: string, 
  language: string,
  history?: ChatHistoryItem[]
): Promise<RouterResult> {
  const lowerQ = question.toLowerCase();
  
  // Только для погоды используем прямой ответ (реальные данные API)
  if (isWeatherQuestion(question)) {
    console.log('[Router] Weather question - fetching real data');
    const forecast = await getWeatherForecast();
    if (forecast) {
      return {
        originalQuestion: question,
        enrichedQuestion: question,
        questionType: 'weather',
        needsKnowledgeBase: false,
        context: 'Погода для пляжного волейбола в Zizishausen',
        instructions: '',
        isAmbiguous: false,
        directAnswer: formatWeatherResponse(forecast, language),
        weatherData: forecast,
      };
    }
  }
  
  // Анализируем вопрос и историю для создания умного промпта
  const analysis = analyzeQuestion(question, language, history);
  
  console.log('[Router] Analysis:', JSON.stringify(analysis, null, 2));
  
  return analysis;
}

// Проверка на вопрос о погоде
function isWeatherQuestion(question: string): boolean {
  const lowerQ = question.toLowerCase();
  const weatherKeywords = [
    'погод', 'weather', 'wetter',
    'дождь', 'rain', 'regen',
    'солнц', 'sun', 'sonne',
    'можно играть', 'can we play', 'können wir spielen',
  ];
  return weatherKeywords.some(kw => lowerQ.includes(kw));
}

// Умный анализ вопроса с учётом истории чата
function analyzeQuestion(
  question: string, 
  language: string, 
  history?: ChatHistoryItem[]
): RouterResult {
  const lowerQ = question.toLowerCase();
  
  // Определяем тип вопроса
  let questionType: RouterResult['questionType'] = 'general';
  let isAmbiguous = false;
  let enrichedQuestion = question;
  let context = '';
  let instructions = '';
  
  // Анализируем историю чата для понимания контекста
  const historyContext = analyzeHistory(history);
  
  // Ключевые слова для определения типа
  const rulesKeywords = ['размер', 'поле', 'площадк', 'игрок', 'команд', 'правил', 'очк', 'сет', 'подач', 'блок', 'атак',
                         'size', 'field', 'court', 'player', 'team', 'rule', 'point', 'set', 'serve', 'block', 'attack',
                         'größe', 'feld', 'spieler', 'mannschaft', 'regel', 'punkt', 'satz', 'aufschlag'];
  const locationKeywords = ['адрес', 'где', 'место', 'как добраться', 'address', 'where', 'location', 'adresse', 'wo'];
  const scheduleKeywords = ['расписан', 'когда', 'время', 'во сколько', 'schedule', 'when', 'time', 'wann', 'zeit'];
  const contactKeywords = ['контакт', 'связ', 'телефон', 'email', 'contact', 'kontakt'];
  
  // Определяем тип вопроса
  if (rulesKeywords.some(kw => lowerQ.includes(kw))) {
    questionType = 'rules';
    
    // Проверяем, неоднозначный ли вопрос (может относиться к обоим видам волейбола)
    const mentionsBeach = lowerQ.includes('пляж') || lowerQ.includes('beach') || lowerQ.includes('strand');
    const mentionsIndoor = lowerQ.includes('зал') || lowerQ.includes('классич') || lowerQ.includes('indoor') || lowerQ.includes('halle');
    
    // Если не указан конкретный вид - вопрос неоднозначный
    if (!mentionsBeach && !mentionsIndoor) {
      isAmbiguous = true;
      
      // Проверяем историю - может пользователь уже уточнял
      if (historyContext.lastTopic === 'beach') {
        enrichedQuestion = `${question} (для пляжного волейбола)`;
        context = 'Из контекста чата: пользователь спрашивает про пляжный волейбол';
      } else if (historyContext.lastTopic === 'indoor') {
        enrichedQuestion = `${question} (для классического волейбола в зале)`;
        context = 'Из контекста чата: пользователь спрашивает про классический волейбол';
      } else {
        // Обогащаем вопрос для поиска обоих вариантов
        enrichedQuestion = `${question} - правила и размеры для классического волейбола (зал, 18x9м, 6 игроков) и пляжного волейбола (песок, 16x8м, 2 игрока)`;
        context = 'Вопрос неоднозначный - в клубе есть ДВА вида волейбола';
      }
    }
  } else if (locationKeywords.some(kw => lowerQ.includes(kw))) {
    questionType = 'location';
    enrichedQuestion = `${question} - адреса тренировок: зал Bettwiesenhalle и пляж Beachanlage Zizishausen`;
    context = 'Показать ОБА места тренировок с адресами и картами';
  } else if (scheduleKeywords.some(kw => lowerQ.includes(kw))) {
    questionType = 'schedule';
    enrichedQuestion = `${question} - расписание тренировок в зале и на пляже`;
    context = 'Показать расписание для обоих видов волейбола';
  } else if (contactKeywords.some(kw => lowerQ.includes(kw))) {
    questionType = 'contact';
  }
  
  // Генерируем инструкции для LLM на основе анализа
  instructions = generateInstructions(questionType, isAmbiguous, language, historyContext);
  
  return {
    originalQuestion: question,
    enrichedQuestion,
    questionType,
    needsKnowledgeBase: true,
    context,
    instructions,
    isAmbiguous,
  };
}

// Анализ истории чата для понимания контекста
function analyzeHistory(history?: ChatHistoryItem[]): { lastTopic: 'beach' | 'indoor' | 'unknown' } {
  if (!history || history.length === 0) {
    return { lastTopic: 'unknown' };
  }
  
  // Смотрим последние сообщения
  const recentMessages = history.slice(-6);
  const allText = recentMessages.map(m => m.content.toLowerCase()).join(' ');
  
  const beachKeywords = ['пляж', 'beach', 'песок', 'sand', 'zizishausen', '16x8', '16×8', '2 игрок'];
  const indoorKeywords = ['зал', 'indoor', 'halle', 'bettwiesenhalle', '18x9', '18×9', '6 игрок'];
  
  const beachScore = beachKeywords.filter(kw => allText.includes(kw)).length;
  const indoorScore = indoorKeywords.filter(kw => allText.includes(kw)).length;
  
  if (beachScore > indoorScore) return { lastTopic: 'beach' };
  if (indoorScore > beachScore) return { lastTopic: 'indoor' };
  return { lastTopic: 'unknown' };
}

// Генерация инструкций для LLM
function generateInstructions(
  questionType: RouterResult['questionType'],
  isAmbiguous: boolean,
  language: string,
  historyContext: { lastTopic: 'beach' | 'indoor' | 'unknown' }
): string {
  const instructions: string[] = [];
  
  if (isAmbiguous) {
    if (language === 'ru') {
      instructions.push('⚠️ ВАЖНО: Вопрос может относиться к ДВУМ видам волейбола!');
      instructions.push('');
      instructions.push('ОБЯЗАТЕЛЬНО дай информацию про ОБА вида, структурируй ответ:');
      instructions.push('');
      instructions.push('**🏐 Классический волейбол (в зале):**');
      instructions.push('[информация из базы знаний]');
      instructions.push('');
      instructions.push('**🏖️ Пляжный волейбол:**');
      instructions.push('[информация из базы знаний]');
    } else if (language === 'en') {
      instructions.push('⚠️ IMPORTANT: Question may refer to TWO types of volleyball!');
      instructions.push('Give info about BOTH: Indoor and Beach volleyball');
    } else {
      instructions.push('⚠️ WICHTIG: Frage kann sich auf ZWEI Volleyballarten beziehen!');
      instructions.push('Gib Infos zu BEIDEN: Hallen- und Beachvolleyball');
    }
  }
  
  // Специфичные инструкции по типу вопроса
  switch (questionType) {
    case 'location':
      if (language === 'ru') {
        instructions.push('Покажи ОБА места с Google Maps ссылками');
      }
      break;
    case 'schedule':
      if (language === 'ru') {
        instructions.push('Дай расписание для обоих видов волейбола');
      }
      break;
  }
  
  // Учитываем контекст из истории
  if (historyContext.lastTopic !== 'unknown') {
    const topic = historyContext.lastTopic === 'beach' ? 'пляжный волейбол' : 'классический волейбол';
    instructions.push(`Из контекста чата: пользователь интересуется ${topic}`);
  }
  
  return instructions.join('\n');
}

// Генерирует дополнительные инструкции для основного агента
export function getRouterInstructions(result: RouterResult, _language: string): string {
  const parts: string[] = [];
  
  // Добавляем контекст
  if (result.context) {
    parts.push(`КОНТЕКСТ: ${result.context}`);
  }
  
  // Добавляем инструкции от анализатора
  if (result.instructions) {
    parts.push(result.instructions);
  }
  
  return parts.join('\n\n');
}
