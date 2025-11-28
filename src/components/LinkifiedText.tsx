import React from 'react';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

/**
 * Компонент для отображения текста с кликабельными ссылками
 * Без использования dangerouslySetInnerHTML для надежности
 */
export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  // Регулярные выражения для поиска ссылок
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const wwwRegex = /(www\.[^\s]+)/g;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

  // Разделяем текст на части: текст и ссылки
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Создаем объединенное регулярное выражение
  const combinedRegex =
    /(https?:\/\/[^\s)\]]+)|(www\.[^\s)\]]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Добавляем текст до ссылки
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const url = match[0];
    let href = url;
    let displayText = url;

    // Обрабатываем разные типы ссылок
    if (url.startsWith('www.')) {
      href = `https://${url}`;
    } else if (url.includes('@')) {
      href = `mailto:${url}`;
    }

    // Обрезаем длинные URL для отображения
    if (displayText.length > 50) {
      displayText = displayText.substring(0, 47) + '...';
    }

    // Добавляем кликабельную ссылку
    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-600 underline break-words cursor-pointer"
        title={href}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {displayText}
      </a>
    );

    lastIndex = combinedRegex.lastIndex;
  }

  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Если нет ссылок, возвращаем обычный текст
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return <span className={className}>{parts}</span>;
}
