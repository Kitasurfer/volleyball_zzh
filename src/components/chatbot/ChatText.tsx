import { Fragment, useMemo, type ReactNode } from 'react';
import { marked, type Token } from 'marked';

export function safeChatHref(raw?: string) {
  if (!raw || raw !== raw.trim() || /[\s\\]/u.test(raw) || raw.startsWith('//')) return;
  if (raw.startsWith('/')) return raw;
  try {
    const url = new URL(raw);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return raw;
    if (url.protocol === 'mailto:' && /^[^?@]+@[^?@]+\.[^?@]+$/.test(url.pathname)) return raw;
  } catch { /* Invalid destinations are rendered as text. */ }
}

const bareUrl = /(https?:\/\/[^\s<>()]+|mailto:[^\s<>()]+|www\.[^\s<>()]+)/giu;

function highlight(text: string, term: string): ReactNode {
  if (!term) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.split(new RegExp(`(${escaped})`, 'gi')).map((part, i) => i % 2
    ? <mark key={i} className="rounded bg-yellow-200 text-neutral-900">{part}</mark> : part);
}

function anchor(part: string, label: ReactNode) {
  const href = part.startsWith('www.') ? `https://${part}` : part;
  return safeChatHref(href)
    ? <a href={safeChatHref(href)} className="break-all text-primary-700 underline"
        target="_blank" rel="noopener noreferrer">{label}</a>
    : label;
}

export function ChatText({ text, plain, search = '' }: {
  text: string; plain: boolean; search?: string;
}) {
  const tokens = useMemo(() => plain ? [] : marked.lexer(text, { breaks: true }), [plain, text]);
  const term = search.trim();
  const leaf = (value: string) => value.split(bareUrl).map((part, i) =>
    i % 2 ? anchor(part, highlight(part, term)) : highlight(part, term));
  function children(items: Token[]) {
    return items.map((item, i) => <Fragment key={i}>{render(item)}</Fragment>);
  }
  function render(token: Token): ReactNode {
    switch (token.type) {
      case 'space': return null;
      case 'br': return <br />;
      case 'hr': return <hr />;
      case 'heading': return <p className="font-bold">{children(token.tokens)}</p>;
      case 'paragraph': return <p>{children(token.tokens)}</p>;
      case 'strong': return <strong>{children(token.tokens)}</strong>;
      case 'em': return <em>{children(token.tokens)}</em>;
      case 'del': return <del>{children(token.tokens)}</del>;
      case 'code': case 'codespan': return <code className="whitespace-pre-wrap">{leaf(token.text)}</code>;
      case 'blockquote': return <blockquote className="border-l-2 pl-2">{children(token.tokens)}</blockquote>;
      case 'list': {
        const items = token.items.map((item: { tokens: Token[] }, i: number) =>
          <li key={i}>{children(item.tokens)}</li>);
        return token.ordered ? <ol start={Number(token.start) || 1} className="list-decimal pl-5">{items}</ol>
          : <ul className="list-disc pl-5">{items}</ul>;
      }
      case 'link': {
        const href = safeChatHref(token.href);
        return href ? <a href={href} className="break-words text-primary-700 underline"
          target={href.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer">
          {children(token.tokens)}</a> : children(token.tokens);
      }
      case 'text': return token.tokens ? children(token.tokens) : leaf(token.text);
      case 'escape': case 'image': return leaf(token.text);
      default: return leaf(token.raw);
    }
  }
  return <div className="space-y-2 whitespace-pre-line break-words text-sm leading-relaxed">
    {plain ? leaf(text) : children(tokens)}
  </div>;
}
