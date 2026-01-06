/**
 * Weather Widget for Beach Volleyball
 * Shows current weather and forecast for Zizishausen
 */
import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import type { Language } from '../../types';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  precipitation: number;
  timestamp: string;
  date: string;
}

interface WeatherForecast {
  current: WeatherData;
  hourly: WeatherData[];
  daily: WeatherData[];
  recommendation: string;
}

const ZIZISHAUSEN_LAT = 48.6167;
const ZIZISHAUSEN_LON = 9.3333;

const weatherTranslations = {
  de: {
    title: 'Wetter für Beach Volleyball',
    subtitle: 'Zizishausen',
    current: 'Aktuell',
    forecast: 'Vorhersage',
    dailyForecast: '3-Tage Vorhersage',
    temperature: 'Temperatur',
    wind: 'Wind (m/s)',
    humidity: 'Luftfeuchtigkeit',
    precipitation: 'Niederschlag',
    today: 'Heute',
    tomorrow: 'Morgen',
    dayAfterTomorrow: 'Übermorgen',
    loading: 'Wetter wird geladen...',
    error: 'Wetter konnte nicht geladen werden',
    retry: 'Erneut versuchen',
    goodConditions: '✅ Perfekte Bedingungen für Beach Volleyball!',
    okConditions: '⚠️ Akzeptable Bedingungen (etwas kühl)',
    badConditions: '❌ Nicht empfohlen zum Spielen',
    updatedAt: 'Aktualisiert',
  },
  en: {
    title: 'Weather for Beach Volleyball',
    subtitle: 'Zizishausen',
    current: 'Current',
    forecast: 'Forecast',
    dailyForecast: '3-Day Forecast',
    temperature: 'Temperature',
    wind: 'Wind (m/s)',
    humidity: 'Humidity',
    precipitation: 'Precipitation',
    today: 'Today',
    tomorrow: 'Tomorrow',
    dayAfterTomorrow: 'Day After Tomorrow',
    loading: 'Loading weather...',
    error: 'Could not load weather',
    retry: 'Retry',
    goodConditions: '✅ Perfect conditions for beach volleyball!',
    okConditions: '⚠️ Acceptable conditions (a bit cool)',
    badConditions: '❌ Not recommended for playing',
    updatedAt: 'Updated',
  },
  ru: {
    title: 'Погода для пляжного волейбола',
    subtitle: 'Цицисхаузен',
    current: 'Сейчас',
    forecast: 'Прогноз',
    dailyForecast: 'Прогноз на 3 дня',
    temperature: 'Температура',
    wind: 'Ветер (м/с)',
    humidity: 'Влажность',
    precipitation: 'Осадки',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    dayAfterTomorrow: 'Послезавтра',
    loading: 'Загрузка погоды...',
    error: 'Не удалось загрузить погоду',
    retry: 'Повторить',
    goodConditions: '✅ Идеальные условия для пляжного волейбола!',
    okConditions: '⚠️ Приемлемые условия (немного прохладно)',
    badConditions: '❌ Не рекомендуется для игры',
    updatedAt: 'Обновлено',
  },
  it: {
    title: 'Meteo per Beach Volley',
    subtitle: 'Zizishausen',
    current: 'Attuale',
    forecast: 'Previsione',
    dailyForecast: 'Previsione 3 giorni',
    temperature: 'Temperatura',
    wind: 'Vento (m/s)',
    humidity: 'Umidità relativa',
    precipitation: 'Precipitazioni',
    today: 'Oggi',
    tomorrow: 'Domani',
    dayAfterTomorrow: 'Dopodomani',
    loading: 'Caricamento meteo...',
    error: 'Impossibile caricare il meteo',
    retry: 'Riprova',
    goodConditions: '✅ Condizioni perfette per beach volley!',
    okConditions: '⚠️ Condizioni accettabili (un po\' fresco)',
    badConditions: '❌ Non consigliato per giocare',
    updatedAt: 'Aggiornato',
  },
};

const getWeatherIcon = (code: number, size: number = 24) => {
  const className = `w-${size} h-${size}`;
  
  // WMO Weather codes
  if (code === 0) return <Sun className={className} />;
  if (code <= 3) return <Cloud className={className} />;
  if (code >= 51 && code <= 67) return <CloudRain className={className} />;
  if (code >= 80) return <CloudRain className={className} />;
  
  return <Cloud className={className} />;
};

const getRecommendation = (weather: WeatherData, language: Language): string => {
  const t = weatherTranslations[language];
  
  // Bad conditions - слишком холодно, дождь, сильный ветер
  if (weather.temperature < 10 || weather.precipitation > 0.5 || weather.weatherCode >= 51 || weather.windSpeed > 7) {
    return t.badConditions;
  }
  
  // Good conditions - идеальные для пляжного волейбола
  if (weather.temperature >= 18 && weather.temperature <= 30 && weather.windSpeed < 4 && weather.precipitation <= 0.1) {
    return t.goodConditions;
  }
  
  // OK conditions - приемлемые, но не идеальные
  if (weather.temperature >= 10 && weather.temperature < 18 && weather.windSpeed <= 6 && weather.precipitation <= 0.3) {
    return t.okConditions;
  }
  
  // Всё остальное - плохие условия
  return t.badConditions;
};

export const WeatherWidget: React.FC = () => {
  const { language } = useLanguage();
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = weatherTranslations[language];

  const fetchWeather = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${ZIZISHAUSEN_LAT}&longitude=${ZIZISHAUSEN_LON}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,precipitation&hourly=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,precipitation&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max,precipitation_sum&timezone=Europe/Berlin&forecast_days=3`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather API error');
      
      const data = await response.json();
      
      const current: WeatherData = {
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        windSpeed: Math.round(data.current.wind_speed_10m / 3.6), // Convert km/h to m/s
        humidity: data.current.relative_humidity_2m,
        precipitation: data.current.precipitation,
        timestamp: data.current.time,
        date: new Date(data.current.time).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : language === 'it' ? 'it-IT' : 'en-US'),
      };

      const hourly: WeatherData[] = data.hourly.time.slice(0, 6).map((time: string, i: number) => ({
        temperature: Math.round(data.hourly.temperature_2m[i]),
        weatherCode: data.hourly.weather_code[i],
        windSpeed: Math.round(data.hourly.wind_speed_10m[i] / 3.6), // Convert km/h to m/s
        humidity: data.hourly.relative_humidity_2m[i],
        precipitation: data.hourly.precipitation[i],
        timestamp: time,
        date: new Date(time).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : language === 'it' ? 'it-IT' : 'en-US'),
      }));

      const daily: WeatherData[] = data.daily.time.map((time: string, i: number) => ({
        temperature: Math.round((data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2),
        weatherCode: data.daily.weather_code[i],
        windSpeed: Math.round(data.daily.wind_speed_10m_max[i] / 3.6), // Convert km/h to m/s
        humidity: 0, // Daily humidity not available in this API
        precipitation: data.daily.precipitation_sum[i],
        timestamp: time,
        date: new Date(time).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : language === 'it' ? 'it-IT' : 'en-US'),
      }));

      setWeather({
        current,
        hourly,
        daily,
        recommendation: getRecommendation(current, language),
      });
    } catch (err) {
      setError(t.error);
      console.error('Weather fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [language]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl shadow-xl border border-sky-100 p-8">
        <div className="flex items-center justify-center gap-3 text-sky-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-xl border border-red-100 p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={fetchWeather}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            {t.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-sky-200 bg-gradient-to-r from-sky-100 to-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-500/25">
              {getWeatherIcon(weather.current.weatherCode, 5)}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-900">{t.title}</h3>
              <p className="text-sm text-neutral-600">{t.subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-900">
              {weather.current.temperature}°C
            </div>
          </div>
        </div>
      </div>

      {/* Current Weather */}
      <div className="p-6 border-b border-sky-100">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Wind className="w-4 h-4 text-sky-500" />
            <div>
              <p className="text-neutral-500 text-xs">{t.wind}</p>
              <p className="font-semibold text-primary-900">{weather.current.windSpeed} m/s</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="w-4 h-4 text-sky-500" />
            <div>
              <p className="text-neutral-500 text-xs">{t.humidity}</p>
              <p className="font-semibold text-primary-900">{weather.current.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CloudRain className="w-4 h-4 text-sky-500" />
            <div>
              <p className="text-neutral-500 text-xs">{t.precipitation}</p>
              <p className="font-semibold text-primary-900">{weather.current.precipitation} mm</p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-4 p-3 rounded-lg bg-white border border-sky-100">
          <p className="text-sm font-medium text-center">{weather.recommendation}</p>
          <p className="text-xs text-neutral-500 text-center mt-1">{weather.current.date}</p>
        </div>
      </div>

      {/* Daily Forecast */}
      <div className="p-6 border-b border-sky-100">
        <h4 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wide">
          {t.dailyForecast}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {weather.daily.slice(0, 3).map((day, i) => {
            const dayLabel = i === 0 ? t.today : i === 1 ? t.tomorrow : t.dayAfterTomorrow;
            const dayRecommendation = getRecommendation(day, language);
            
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border text-center ${
                  dayRecommendation === t.goodConditions
                    ? 'bg-green-50 border-green-200'
                    : dayRecommendation === t.okConditions
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <p className="text-xs font-medium text-neutral-600 mb-1">{dayLabel}</p>
                <p className="text-xs text-neutral-500 mb-2">{day.date}</p>
                <div className="flex justify-center mb-2">
                  {getWeatherIcon(day.weatherCode, 20)}
                </div>
                <p className="text-lg font-bold text-primary-900">{day.temperature}°C</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-xs text-neutral-600">
                  <Wind className="w-3 h-3" />
                  <span>{day.windSpeed} m/s</span>
                </div>
                {day.precipitation > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-blue-600">
                    <CloudRain className="w-3 h-3" />
                    <span>{day.precipitation} mm</span>
                  </div>
                )}
                <p className="text-xs mt-2 font-medium">{dayRecommendation}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="p-6">
        <h4 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wide">
          {t.forecast}
        </h4>
        <div className="grid grid-cols-6 gap-2">
          {weather.hourly.map((hour, i) => {
            const time = new Date(hour.timestamp).getHours();
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-2 rounded-lg bg-white border border-sky-100 hover:border-sky-200 transition-colors"
              >
                <span className="text-xs font-medium text-neutral-600">{time}:00</span>
                {getWeatherIcon(hour.weatherCode, 5)}
                <span className="text-sm font-semibold text-primary-900">{hour.temperature}°</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-sky-50 border-t border-sky-100">
        <p className="text-xs text-neutral-500 text-center">
          {t.updatedAt}: {new Date(weather.current.timestamp).toLocaleTimeString(language)}
        </p>
      </div>
    </div>
  );
};
