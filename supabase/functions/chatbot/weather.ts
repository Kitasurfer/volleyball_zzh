import type { Language } from './intent.ts';
import { messages } from './messages.ts';

const ZIZISHAUSEN_LAT = 48.6167;
const ZIZISHAUSEN_LON = 9.3333;

export async function weatherAnswer(language: Language) {
  const m = messages[language];
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(ZIZISHAUSEN_LAT), longitude: String(ZIZISHAUSEN_LON),
    daily: 'temperature_2m_min,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'Europe/Berlin', forecast_days: '3',
  }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error('weather_unavailable');
  const { daily: d } = await response.json();
  if (!Array.isArray(d?.time) || !d.time.length) throw new Error('weather_unavailable');
  const days = d.time.map((date: string, i: number) => {
    const values = [d.temperature_2m_min[i], d.temperature_2m_max[i],
      d.wind_speed_10m_max[i], d.precipitation_probability_max[i]];
    if (!values.every(Number.isFinite)) throw new Error('weather_incomplete');
    const day = new Intl.DateTimeFormat(language, {
      month: 'short', day: 'numeric', timeZone: 'Europe/Berlin',
    }).format(new Date(`${date}T12:00:00Z`));
    const [min, max, wind, rain] = values.map(Math.round);
    return `- ${day}: ${min}–${max} °C · ${m.wind}: ${wind} km/h · ${m.rain}: ${rain}%`;
  });
  return `**${m.weather}**\n${days.join('\n')}`;
}
