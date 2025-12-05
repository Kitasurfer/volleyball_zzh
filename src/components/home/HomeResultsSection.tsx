import { Alert, Spinner } from '../ui';
import type { StandingsResponse } from '../../types/standings';

interface ResultsTranslations {
  title: string;
  updatedPrefix: string;
  loading: string;
  error: string;
  noData: string;
  teamHighlightTitle: string;
  table: {
    position: string;
    team: string;
    matches: string;
    wins: string;
    sets: string;
    points: string;
  };
}

interface HomeResultsSectionProps {
  t: ResultsTranslations;
  data: StandingsResponse | undefined;
  isLoading: boolean;
  error: unknown;
  formattedUpdatedAt: string | null;
}

export const HomeResultsSection = ({
  t,
  data,
  isLoading,
  error,
  formattedUpdatedAt,
}: HomeResultsSectionProps) => {
  const hasStandings = data?.standings && data.standings.length > 0;

  return (
    <section className="py-20 bg-gradient-to-br from-[#1f4588] via-[#25509a] to-[#1f4588] text-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="lg:w-2/3">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-h2 font-bold">{t.title}</h2>
              {formattedUpdatedAt && (
                <span className="text-sm text-white/70">
                  {t.updatedPrefix} {formattedUpdatedAt}
                </span>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm">
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <Spinner color="white" text={t.loading} />
                </div>
              ) : error ? (
                <div className="p-6">
                  <Alert type="error" title="Error">
                    {t.error}
                  </Alert>
                </div>
              ) : !hasStandings ? (
                <div className="p-6 text-sm text-white/80">{t.noData}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/70">
                        <th className="px-4 py-3">{t.table.position}</th>
                        <th className="px-4 py-3">{t.table.team}</th>
                        <th className="px-4 py-3 text-center">{t.table.matches}</th>
                        <th className="px-4 py-3 text-center">{t.table.wins}</th>
                        <th className="px-4 py-3 text-center">{t.table.sets}</th>
                        <th className="px-4 py-3 text-center">{t.table.points}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data!.standings!.map((standing) => {
                        const isTeamRow = data?.team
                          ? standing.name === data.team.name
                          : standing.name.includes('Zizishausen');

                        return (
                          <tr
                            key={`${standing.position}-${standing.name}`}
                            className={`border-b border-white/10 ${
                              isTeamRow ? 'bg-white/15' : 'transition-colors hover:bg-white/5'
                            }`}
                          >
                            <td className="px-4 py-3 font-semibold">{standing.position}</td>
                            <td className="px-4 py-3">{standing.name}</td>
                            <td className="px-4 py-3 text-center">{standing.matches}</td>
                            <td className="px-4 py-3 text-center">{standing.wins}</td>
                            <td className="px-4 py-3 text-center">{standing.sets}</td>
                            <td className="px-4 py-3 text-center font-semibold">{standing.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="lg:flex-1">
            <div className="rounded-xl bg-white p-8 text-primary-900 shadow-xl">
              <h3 className="mb-4 text-h3 font-semibold">{t.teamHighlightTitle}</h3>
              {data?.team ? (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-bold">{data.team.position}</span>
                    <span className="text-sm font-semibold uppercase tracking-wide text-primary-500">
                      {t.table.position}
                    </span>
                  </div>
                  <p className="mt-4 text-body font-medium">{data.team.name}</p>
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-500">{t.table.matches}</p>
                      <p className="text-h4 font-semibold">{data.team.matches}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">{t.table.wins}</p>
                      <p className="text-h4 font-semibold">{data.team.wins}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">{t.table.sets}</p>
                      <p className="text-h4 font-semibold">{data.team.sets}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">{t.table.points}</p>
                      <p className="text-h4 font-semibold">{data.team.points}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-600">{t.noData}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
