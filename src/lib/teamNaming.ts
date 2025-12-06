const RAW_TEAM_NAME = 'SG TSV Zizishausen/SKV Unterensingen';
const DISPLAY_TEAM_NAME = 'SKV Unterensingen';

export const normalizeTeamName = (name: string): string => {
  if (!name) return name;
  return name.includes('Zizishausen') ? DISPLAY_TEAM_NAME : name;
};

export const isOurTeamName = (name: string): boolean => {
  if (!name) return false;
  return name.includes('Zizishausen') || name.includes(DISPLAY_TEAM_NAME);
};
