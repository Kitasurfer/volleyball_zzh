import { beachSchedule2026, contactEmail, hallSchedule2026, publishedYear, scheduleLabels, venues } from '../_shared/clubSchedule.ts';
import type { Route, Venue } from './intent.ts';
import { messages } from './messages.ts';
import { publicRows } from './publicData.ts';
import type { Answer, Citation } from './types.ts';
import { weatherAnswer } from './weather.ts';

const source = (title: string, url: string): Citation => ({ id: url, score: 1, title, url });
const literal = (text: string) => text.replace(/[\r\n]/g, ' ').replace(/([\\`*_~<>[\]])/g, '\\$1');
interface ScoreRow {
  match_id: string; team_a: string; team_b: string; scheduled_at: string | null;
  state: { status: string; sets: { a: number; b: number; winner: string | null }[];
    outcome: string | null; winner: 'a' | 'b' | null };
}

async function matchAnswer(route: Route, now: Date): Promise<Answer> {
  const { language, kind } = route;
  const m = messages[language];
  const params = new URLSearchParams({
    select: 'match_id,team_a,team_b,scheduled_at,state', limit: '5',
    'state->>status': kind === 'live' ? 'in.(live,paused)' : kind === 'next' ? 'eq.scheduled' : 'eq.completed',
    order: kind === 'next' ? 'scheduled_at.asc' : kind === 'results' ? 'finished_at.desc.nullslast' : 'updated_at.desc',
  });
  if (kind === 'next') params.set('scheduled_at', `gte.${now.toISOString()}`);
  const citations = [source(m.board, '/scoreboard')];
  const rows = await publicRows<ScoreRow>('skv_public_scores', params);
  if (!rows.length) return { answer: m.empty, citations };
  const date = new Intl.DateTimeFormat(language, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
  });
  // Label this as an overview, not a claim about a specific team mentioned in the question.
  const lines = rows.map(r => {
    const s = r.state;
    const names = `${literal(r.team_a)} – ${literal(r.team_b)}`;
    const link = `/scoreboard/${encodeURIComponent(r.match_id)}`;
    const current = s.sets.at(-1);
    const sets = (side: string) => s.sets.filter(set => set.winner === side).length;
    let score = `${m.sets} ${sets('a')}:${sets('b')}`;
    if (kind === 'live' && current) score += ` · ${m.set} ${s.sets.length}: ${current.a}:${current.b}`;
    if (s.status === 'paused') score += ` (${m.paused})`;
    if (s.outcome === 'walkover' && s.winner) score = `${m.walkover}: ${literal(s.winner === 'a' ? r.team_a : r.team_b)}`;
    return `- [${names}](${link}): ${kind === 'next' && r.scheduled_at ? date.format(new Date(r.scheduled_at)) : score}`;
  });
  return { answer: `**${kind === 'next' ? m.next : kind === 'live' ? m.live : m.results}**\n${lines.join('\n')}`, citations };
}

export async function directAnswer(route: Route, now = new Date(), question = route.search): Promise<Answer | undefined> {
  const { kind, language: lang, venue } = route;
  const m = messages[lang], labels = scheduleLabels[lang];
  const contact = source(m.contact, '/contact');
  if (kind === 'greeting') return { answer: m.hello, citations: [] };
  if (kind === 'confirmation') return { answer: m.confirmation, citations: [contact] };
  if (kind === 'contact') return { answer: `${m.contact}: ${contactEmail}`, citations: [contact] };
  if (kind === 'league') return { answer: m.league, citations: [source(m.table, '/competitions')] };
  if (kind === 'live' || kind === 'next' || kind === 'results') {
    try { return await matchAnswer(route, now); } catch {
      return { answer: m.unavailable, citations: [source(m.board, '/scoreboard')] };
    }
  }
  if (kind === 'weather') {
    try { return { answer: await weatherAnswer(lang), citations: [source('Open-Meteo', 'https://open-meteo.com/')] }; }
    catch { return { answer: m.unavailable, citations: [] }; }
  }
  if (kind !== 'schedule' && kind !== 'location') return;
  const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Europe/Berlin' }).format(now);
  const requestedYear = route.search.match(/\b20\d{2}\b/)?.[0] ?? year;
  if (kind === 'schedule' && Number(requestedYear) !== publishedYear) return { answer: m.unknown, citations: [contact] };
  const keys: Venue[] = venue ? [venue] : ['hall', 'beach'];
  const citations: Citation[] = [];
  const month = (n: number) => new Intl.DateTimeFormat(lang, { month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(publishedYear, n - 1, 1)));
  const today = /сегодня|\btoday\b|\bheute\b|\boggi\b/iu.test(question);
  const tomorrow = /завтра|\btomorrow\b|\bmorgen\b|\bdomani\b/iu.test(question);
  const next = /ближайш|следующ|\bnext\b|nächst|prossim/iu.test(question);
  if (kind === 'schedule' && (today || tomorrow || next)) {
    const local = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'short',
      timeZone: 'Europe/Berlin' }).format(now);
    const [day, clock] = local.split(' ');
    const date = new Date(`${day}T12:00:00Z`);
    if (tomorrow) date.setUTCDate(date.getUTCDate() + 1);
    const dateLabel = new Intl.DateTimeFormat(lang, { dateStyle: 'full', timeZone: 'UTC' });
    const weekday = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' });
    for (let i = 0; i < (next && !today && !tomorrow ? 366 : 1); i++, date.setUTCDate(date.getUTCDate() + 1)) {
      if (date.getUTCFullYear() !== publishedYear) break;
      const n = date.getUTCMonth() + 1, sessions = [];
      for (const key of keys) {
        const { from, until } = venues[key];
        if (from > until ? n < from && n > until : n < from || n > until) continue;
        const entries = key === 'hall' ? hallSchedule2026 : beachSchedule2026;
        for (const e of entries) {
          if (e.day.en !== weekday.format(date) || (next && !tomorrow && !today && !i && e.time.slice(0, 5) <= clock)) continue;
          sessions.push(`${e.time} · ${e.location?.[lang] ?? venues[key].address}`);
          citations.push(source(key === 'hall' ? labels.hallTitle : labels.beachTitle, `/${key}`));
        }
      }
      if (sessions.length) return { answer: `**${dateLabel.format(date)}** (Europe/Berlin)\n${sessions.sort().map(s => `- ${s}`).join('\n')}\n\n${labels.note}`, citations };
    }
    return { answer: m.noSession, citations: [...keys.map(k => source(k === 'hall' ? labels.hallTitle : labels.beachTitle, `/${k}`)), contact] };
  }
  const sections = keys.map(key => {
    const v = venues[key];
    const title = key === 'hall' ? labels.hallTitle : labels.beachTitle;
    citations.push(source(title, `/${key}`));
    if (kind === 'location') return `**${title}:** ${v.address}\n[${m.map}](https://maps.google.com/?q=${encodeURIComponent(v.address)})`;
    const entries = key === 'hall' ? hallSchedule2026 : beachSchedule2026;
    return `**${title} (${month(v.from)} – ${month(v.until)}):**\n${entries.map(e =>
      `- ${e.day[lang]}, ${e.time}${e.location ? ` · ${e.location[lang]}` : ''}`).join('\n')}`;
  });
  return { answer: kind === 'location' ? sections.join('\n\n') :
    `${labels.title} (Europe/Berlin)\n\n${sections.join('\n\n')}\n\n${labels.note}`, citations };
}
