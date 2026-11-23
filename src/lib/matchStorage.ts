import type { ControlledMatch, HistoryEvent } from '@/lib/matchApi';
import { applyScore, type Action, type MatchEvent } from '@/lib/matchRules';

export interface MatchDraft {
  key: string;
  revision: number;
  device: string;
  fence: number | null;
  confirmed: ControlledMatch;
  projected: ControlledMatch;
  pending: MatchEvent[];
  history: HistoryEvent[];
  conflict: string | null;
}

let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('skv-match-center', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'key' });
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); database = undefined; };
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  }).catch(error => { database = undefined; throw error; });
  return database;
}

async function read<T>(operation: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const request = operation(db.transaction('drafts', 'readonly').objectStore('drafts'));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const readDraft = (key: string): Promise<MatchDraft | undefined> =>
  read(store => store.get(key));

export async function deleteDraft(key: string) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite');
    tx.objectStore('drafts').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export async function localMatches(): Promise<MatchDraft[]> {
  const all: MatchDraft[] = await read(store =>
    store.getAll(IDBKeyRange.bound('local-', 'local-\uffff')));
  return all.sort((a, b) => b.projected.updated_at.localeCompare(a.projected.updated_at));
}

/** CAS prevents another tab from overwriting a newer durable draft. */
export async function saveDraft(draft: MatchDraft, expected: number | undefined) {
  const db = await openDatabase();
  return new Promise<MatchDraft>((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite');
    const store = tx.objectStore('drafts');
    const req = store.get(draft.key);
    const value = { ...draft, revision: (expected ?? -1) + 1 };
    let conflict = false;
    req.onsuccess = () => {
      if (req.result?.revision !== expected) { conflict = true; tx.abort(); return; }
      store.put(value);
    };
    tx.oncomplete = () => resolve(value);
    tx.onabort = () => reject(conflict ? new Error('device_conflict') : tx.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function seedDraft(key: string, match: ControlledMatch): MatchDraft {
  return {
    key, revision: 0, device: crypto.randomUUID(), fence: null, confirmed: match, projected: match,
    pending: [], history: [], conflict: null,
  };
}

const barriers = new Set(['MATCH_COMPLETED', 'MATCH_REOPENED', 'WALKOVER', 'MATCH_CANCELLED']);
export function undoTarget(history: HistoryEvent[]) {
  const undone = new Set<string>();
  for (let i = history.length - 1; i >= 0; i--) {
    const event = history[i];
    if (barriers.has(event.action.type)) return undefined;
    if (event.reference) undone.add(event.reference);
    if (event.action.type !== 'EVENT_UNDONE' && !undone.has(event.id)) return event;
  }
  return undefined;
}

export function queueAction(draft: MatchDraft, action: Action, local: boolean): MatchDraft {
  const before = draft.projected.state;
  const target = action.type === 'EVENT_UNDONE' ? undoTarget(draft.history) : undefined;
  const state = applyScore(before, draft.projected.rules, action, target?.before);
  const event = { id: crypto.randomUUID(), at: new Date().toISOString(),
    base: draft.projected.version, action };
  const projected = { ...draft.projected, state, version: event.base + 1, updated_at: event.at,
    started_at: state.status === 'scheduled' ? null : action.type === 'MATCH_STARTED'
      ? event.at : draft.projected.started_at,
    finished_at: ['completed', 'cancelled'].includes(state.status) ? event.at : null };
  return { ...draft, projected, confirmed: local ? projected : draft.confirmed,
    pending: local ? [] : [...draft.pending, event],
    history: [...draft.history, { ...event, sequence: event.base + 1, before,
      reference: target?.id ?? null }] };
}

export function downloadMatchFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvField(value: string | number) {
  const raw = String(value);
  const safe = /^\s*[=+\-@]/.test(raw) || /^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
