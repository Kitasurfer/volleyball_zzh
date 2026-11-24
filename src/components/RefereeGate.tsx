import { useState, type FormEvent, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { MatchLogin, matchCard, matchInput } from '@/components/MatchScore';
import { matchError, useMatchText } from '@/data/matchTranslations';
import { useAuth } from '@/lib/AuthContext';
import { matchClient, matchRpc } from '@/lib/matchApi';

export default function RefereeGate({ id, children }: { id: string; children?: ReactNode }) {
  const { t } = useMatchText();
  const { user } = useAuth();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const status = useQuery({
    queryKey: ['skv-referee-status', id, user?.id],
    queryFn: () => matchRpc<string>('skv_referee_status', { mid: id }),
    enabled: Boolean(user),
    refetchInterval: 5000,
  });

  async function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('name') ?? '').trim();
    if (!name || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const supabase = matchClient();
      if (!user) {
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw new Error(authError.message);
      }
      await matchRpc('skv_request_referee', { mid: id, referee_name: name });
      await client.invalidateQueries({ queryKey: ['skv-referee-status', id] });
    } catch (cause) { setError(cause); }
    finally { setBusy(false); }
  }

  const state = status.data;
  if (state === 'scoring' || (status.isError && Boolean(user))) return children;
  const form = <form onSubmit={request} className={`${matchCard} max-w-md space-y-3`}>
    <h2 className="text-lg font-bold">{t('refereeRequest')}</h2>
    <p className="text-sm">{t('refereeHint')}</p>
    <label className="block">{t('name')}
      <input name="name" required maxLength={80} className={matchInput} />
    </label>
    {(error || status.isError) &&
      <p role="alert" className="text-rose-800">{matchError(error ?? status.error, t)}</p>}
    <Button type="submit" disabled={busy}>{t('refereeRequest')}</Button>
  </form>;
  if (!user) return <>{form}<MatchLogin /></>;
  if (state === 'pending') {
    return <section className={`${matchCard} max-w-md space-y-2`} aria-live="polite">
      <h2 className="text-lg font-bold">{t('refereeRequest')}</h2>
      <p>{t('refereePending')}</p>
    </section>;
  }
  if (!state && !status.isError) return <p>{t('loading')}</p>;
  return <>
    {(state === 'rejected' || state === 'revoked') &&
      <p role="alert" className="max-w-md">{t('refereeRejected')}</p>}
    {form}
  </>;
}
