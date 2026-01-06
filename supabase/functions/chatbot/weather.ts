// Weather API integration using Open-Meteo (free, no API key required)
// Location: Zizishausen/Nürtingen area for beach volleyball

const ZIZISHAUSEN_LAT = 48.6167;
const ZIZISHAUSEN_LON = 9.3333;

export interface WeatherData {
  date: string;
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
  isGoodForBeachVolleyball: boolean;
  recommendation: string;
}

export interface WeatherForecast {
  current: WeatherData;
  today: WeatherData;
  tomorrow: WeatherData;
  dayAfterTomorrow: WeatherData;
}

// Weather codes from Open-Meteo
const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Ясно', icon: '☀️' },
  1: { description: 'Преимущественно ясно', icon: '🌤️' },
  2: { description: 'Переменная облачность', icon: '⛅' },
  3: { description: 'Пасмурно', icon: '☁️' },
  45: { description: 'Туман', icon: '🌫️' },
  48: { description: 'Изморозь', icon: '🌫️' },
  51: { description: 'Лёгкая морось', icon: '🌦️' },
  53: { description: 'Морось', icon: '🌦️' },
  55: { description: 'Сильная морось', icon: '🌧️' },
  61: { description: 'Небольшой дождь', icon: '🌧️' },
  63: { description: 'Дождь', icon: '🌧️' },
  65: { description: 'Сильный дождь', icon: '🌧️' },
  66: { description: 'Ледяной дождь', icon: '🌨️' },
  67: { description: 'Сильный ледяной дождь', icon: '🌨️' },
  71: { description: 'Небольшой снег', icon: '🌨️' },
  73: { description: 'Снег', icon: '❄️' },
  75: { description: 'Сильный снег', icon: '❄️' },
  77: { description: 'Снежные зёрна', icon: '❄️' },
  80: { description: 'Небольшой ливень', icon: '🌦️' },
  81: { description: 'Ливень', icon: '🌧️' },
  82: { description: 'Сильный ливень', icon: '⛈️' },
  85: { description: 'Небольшой снегопад', icon: '🌨️' },
  86: { description: 'Сильный снегопад', icon: '❄️' },
  95: { description: 'Гроза', icon: '⛈️' },
  96: { description: 'Гроза с градом', icon: '⛈️' },
  99: { description: 'Сильная гроза с градом', icon: '⛈️' },
};

function getWeatherDescription(code: number): string {
  return WEATHER_CODES[code]?.description || 'Неизвестно';
}

function getWeatherIcon(code: number): string {
  return WEATHER_CODES[code]?.icon || '🌡️';
}

// Determine if weather is good for beach volleyball
function evaluateBeachVolleyballConditions(
  temp: number,
  precipitation: number,
  precipProbability: number,
  windSpeed: number,
  weatherCode: number
): { isGood: boolean; recommendation: string } {
  const issues: string[] = [];
  let isGood = true;
  
  // Round values for display
  const roundedTemp = Math.round(temp);
  const roundedWind = Math.round(windSpeed);

  // Temperature check (ideal: 18-30°C)
  if (temp < 15) {
    issues.push(`холодно (${roundedTemp}°C)`);
    isGood = false;
  } else if (temp < 18) {
    issues.push(`прохладно (${roundedTemp}°C), но играть можно`);
  } else if (temp > 35) {
    issues.push(`очень жарко (${roundedTemp}°C), берите воду!`);
  }

  // Precipitation check
  if (precipitation > 0.5 || precipProbability > 60) {
    issues.push(`ожидается дождь (${Math.round(precipProbability)}% вероятность)`);
    isGood = false;
  } else if (precipProbability > 30) {
    issues.push(`возможен дождь (${Math.round(precipProbability)}%)`);
  }

  // Wind check (ideal: < 20 km/h for beach volleyball)
  if (windSpeed > 30) {
    issues.push(`сильный ветер (${roundedWind} км/ч)`);
    isGood = false;
  } else if (windSpeed > 20) {
    issues.push(`ветрено (${roundedWind} км/ч), мяч будет сносить`);
  }

  // Bad weather codes (rain, snow, thunderstorm)
  const badCodes = [61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
  if (badCodes.includes(weatherCode)) {
    isGood = false;
  }

  let recommendation: string;
  if (isGood && issues.length === 0) {
    recommendation = '✅ Отличная погода для пляжного волейбола!';
  } else if (isGood) {
    recommendation = `⚠️ Можно играть, но: ${issues.join(', ')}`;
  } else {
    recommendation = `❌ Не рекомендуется играть: ${issues.join(', ')}`;
  }

  return { isGood, recommendation };
}

export async function getWeatherForecast(): Promise<WeatherForecast | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', ZIZISHAUSEN_LAT.toString());
    url.searchParams.set('longitude', ZIZISHAUSEN_LON.toString());
    url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m,precipitation');
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,wind_speed_10m_max');
    url.searchParams.set('timezone', 'Europe/Berlin');
    url.searchParams.set('forecast_days', '3');

    console.log('[Weather] Fetching forecast from Open-Meteo...');
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('[Weather] API error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[Weather] Data received');

    const current = data.current;
    const daily = data.daily;

    // Helper to create WeatherData for a day
    const createDayData = (index: number): WeatherData => {
      const temp = (daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2;
      const precip = daily.precipitation_sum[index];
      const precipProb = daily.precipitation_probability_max[index];
      const wind = daily.wind_speed_10m_max[index];
      const code = daily.weather_code[index];
      
      const { isGood, recommendation } = evaluateBeachVolleyballConditions(
        temp, precip, precipProb, wind, code
      );

      return {
        date: daily.time[index],
        temperature: Math.round(temp),
        temperatureMax: Math.round(daily.temperature_2m_max[index]),
        temperatureMin: Math.round(daily.temperature_2m_min[index]),
        precipitation: precip,
        precipitationProbability: precipProb,
        windSpeed: Math.round(wind),
        weatherCode: code,
        weatherDescription: `${getWeatherIcon(code)} ${getWeatherDescription(code)}`,
        isGoodForBeachVolleyball: isGood,
        recommendation,
      };
    };

    // Current weather evaluation
    const currentEval = evaluateBeachVolleyballConditions(
      current.temperature_2m,
      current.precipitation,
      daily.precipitation_probability_max[0],
      current.wind_speed_10m,
      current.weather_code
    );

    return {
      current: {
        date: 'Сейчас',
        temperature: Math.round(current.temperature_2m),
        temperatureMax: Math.round(daily.temperature_2m_max[0]),
        temperatureMin: Math.round(daily.temperature_2m_min[0]),
        precipitation: current.precipitation,
        precipitationProbability: daily.precipitation_probability_max[0],
        windSpeed: Math.round(current.wind_speed_10m),
        weatherCode: current.weather_code,
        weatherDescription: `${getWeatherIcon(current.weather_code)} ${getWeatherDescription(current.weather_code)}`,
        isGoodForBeachVolleyball: currentEval.isGood,
        recommendation: currentEval.recommendation,
      },
      today: createDayData(0),
      tomorrow: createDayData(1),
      dayAfterTomorrow: createDayData(2),
    };
  } catch (error) {
    console.error('[Weather] Error fetching forecast:', error);
    return null;
  }
}

// Format weather for chat response
export function formatWeatherResponse(forecast: WeatherForecast, language: string): string {
  const labels = {
    ru: {
      title: '🌤️ Погода для пляжного волейбола в Zizishausen',
      now: 'Сейчас',
      today: 'Сегодня',
      tomorrow: 'Завтра',
      dayAfter: 'Послезавтра',
      temp: 'Температура',
      wind: 'Ветер',
      rain: 'Вероятность дождя',
      location: '📍 Beachanlage Zizishausen',
      schedule: '⏰ Тренировки: Пн и Ср 17:00-20:00 (апрель-сентябрь)',
    },
    en: {
      title: '🌤️ Weather for beach volleyball in Zizishausen',
      now: 'Now',
      today: 'Today',
      tomorrow: 'Tomorrow',
      dayAfter: 'Day after tomorrow',
      temp: 'Temperature',
      wind: 'Wind',
      rain: 'Rain probability',
      location: '📍 Beachanlage Zizishausen',
      schedule: '⏰ Training: Mon & Wed 17:00-20:00 (April-September)',
    },
    de: {
      title: '🌤️ Wetter für Beachvolleyball in Zizishausen',
      now: 'Jetzt',
      today: 'Heute',
      tomorrow: 'Morgen',
      dayAfter: 'Übermorgen',
      temp: 'Temperatur',
      wind: 'Wind',
      rain: 'Regenwahrscheinlichkeit',
      location: '📍 Beachanlage Zizishausen',
      schedule: '⏰ Training: Mo & Mi 17:00-20:00 (April-September)',
    },
  };

  const l = labels[language as keyof typeof labels] || labels.de;

  const formatDay = (day: WeatherData, label: string) => {
    return `**${label}:** ${day.weatherDescription}
${l.temp}: ${day.temperatureMin}°C - ${day.temperatureMax}°C
${l.wind}: ${day.windSpeed} км/ч | ${l.rain}: ${day.precipitationProbability}%
${day.recommendation}`;
  };

  return `${l.title}

${formatDay(forecast.today, l.today)}

${formatDay(forecast.tomorrow, l.tomorrow)}

${formatDay(forecast.dayAfterTomorrow, l.dayAfter)}

---
${l.location}
${l.schedule}
https://maps.google.com/?q=Beachanlage+Zizishausen`;
}
