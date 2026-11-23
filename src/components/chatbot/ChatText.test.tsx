import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChatText } from '@/components/chatbot/ChatText';

describe('chat rendering', () => {
  it('preserves lists, emphasis and links during search; plain user text stays plain', () => {
    const text = '**Bettwiesenhalle**\n\n- [Map](/hall)\n- Width 18 × 9';
    const html = renderToStaticMarkup(<ChatText text={text} plain={false} search="halle" />);
    expect(html).toContain('<strong'); expect(html).toContain('Bettwiesen<mark'); expect(html).toContain('<ul');
    expect(html).toContain('href="/hall"'); expect(html).not.toContain('**');
    expect(renderToStaticMarkup(<ChatText text={text} plain />)).toContain('**Bettwiesenhalle**');
  });
  it('renders arbitrary HTML as text and disallowed link targets as labels, even with search on', () => {
    const html = renderToStaticMarkup(<ChatText text={'<aside>sample</aside>\n\n[label](file:///private)'} plain={false} search="sample" />);
    expect(html).not.toContain('<aside>'); expect(html).toContain('&lt;aside&gt;'); expect(html).not.toContain('href=');
  });
});
