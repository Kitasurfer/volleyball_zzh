import type { Citation } from './types.ts';

// Check if question is a greeting
const isGreetingOrSmallTalk = (question: string): boolean => {
  const lowerQuestion = question.toLowerCase().trim();
  const greetings = [
    'привет', 'здравствуй', 'добрый день', 'добрый вечер', 'доброе утро',
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'hallo', 'guten tag', 'guten morgen', 'guten abend',
    'спасибо', 'thanks', 'thank you', 'danke',
    'пока', 'bye', 'goodbye', 'tschüss', 'auf wiedersehen',
  ];

  return greetings.some(
    (greeting) => lowerQuestion === greeting || lowerQuestion.startsWith(greeting + ' ')
  );
};

// Clean answer text
const cleanAnswer = (text: string, citations: Citation[]): string => {
  if (!text) return '';

  // Remove markdown images
  let cleaned = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  cleaned = cleaned.replace(/<img[^>]*>/gi, '');

  // Filter URLs to only allowed ones from citations
  const allowedUrls = new Set(
    citations.map((c) => c.url).filter((url) => url && /^https?:\/\//.test(url))
  );

  if (allowedUrls.size > 0) {
    const urlRegex = /https?:\/\/[^\s)]+/gi;
    cleaned = cleaned.replace(urlRegex, (rawUrl) => {
      const match = rawUrl.match(/^(https?:\/\/[^\s)]+?)([).,;!?]+)?$/i);
      const url = match ? match[1] : rawUrl;
      const suffix = match && match[2] ? match[2] : '';
      return allowedUrls.has(url) ? url + suffix : '';
    });
  }

  // Clean up broken markdown links
  cleaned = cleaned.replace(/\[([^\]]+)\]\(\s*\)/g, '$1');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
};

export { isGreetingOrSmallTalk, cleanAnswer };
