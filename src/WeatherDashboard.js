import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './App.css';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

function describeWeather(code, isDay = 1) {
  if (code === 0) return { label: 'Clear sky', icon: isDay ? '☀️' : '🌙' };
  if ([1, 2].includes(code)) return { label: 'Partly cloudy', icon: isDay ? '🌤️' : '☁️' };
  if (code === 3) return { label: 'Overcast', icon: '☁️' };
  if ([45, 48].includes(code)) return { label: 'Foggy', icon: '🌫️' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: '🌦️' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { label: 'Rain', icon: '🌧️' };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', icon: '❄️' };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: '⛈️' };
  return { label: 'Current conditions', icon: '🌤️' };
}

function getDayName(dateString, index) {
  if (index === 0) return 'Today';
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en', {
    weekday: 'short',
  });
}

function WeatherDashboard() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortControllerRef = useRef(null);

  const searchWeather = useCallback(async (cityQuery) => {
    const city = cityQuery.trim();
    if (!city) {
      setError('Enter a city or location to see its weather.');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);
    setError('');
    setWeather(null);

    try {
      const locationResponse = await axios.get(GEOCODING_URL, {
        params: { name: city, count: 1, language: 'en', format: 'json' },
        signal: controller.signal,
      });
      const location = locationResponse.data.results?.[0];

      if (!location) {
        setError(`We couldn't find "${city}". Check the spelling and try again.`);
        return;
      }

      const forecastResponse = await axios.get(FORECAST_URL, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          current:
            'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
          daily:
            'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max',
          forecast_days: 5,
          timezone: 'auto',
        },
        signal: controller.signal,
      });

      setWeather({
        location,
        current: forecastResponse.data.current,
        daily: forecastResponse.data.daily,
      });
      setQuery(location.name);
    } catch (requestError) {
      if (axios.isCancel(requestError) || requestError.code === 'ERR_CANCELED') {
        return;
      }
      setError(
        'Weather data is unavailable right now. Please check your connection and try again.',
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    searchWeather('London');
    return () => abortControllerRef.current?.abort();
  }, [searchWeather]);

  function handleSubmit(event) {
    event.preventDefault();
    searchWeather(query);
  }

  const conditions = weather
    ? describeWeather(weather.current.weather_code, weather.current.is_day)
    : null;
  const daily = weather?.daily;

  return (
    <div className="weather-app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Atmos home">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>atmos</span>
        </a>
        <span className="topbar-note">YOUR EVERYDAY WEATHER</span>
      </header>

      <main className="dashboard" aria-busy={loading}>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">A little closer to the sky</p>
          <h1 id="page-title">Weather, wherever you are.</h1>
          <p className="intro-copy">
            Find the forecast for your corner of the world.
          </p>

          <form className="search-form" onSubmit={handleSubmit} role="search">
            <label className="visually-hidden" htmlFor="city-search">
              Search for a city
            </label>
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              id="city-search"
              type="search"
              placeholder="Search a city..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>
        </section>

        {error && (
          <div className="error-message" role="alert">
            <span aria-hidden="true">!</span>
            {error}
          </div>
        )}

        {loading && !weather && (
          <section className="loading-card" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Finding the forecast…</span>
          </section>
        )}

        {weather && (
          <div className="weather-content">
            <section className="current-card" aria-label="Current weather">
              <div className="current-main">
                <div className="current-copy">
                  <p className="eyebrow card-eyebrow">CURRENT WEATHER</p>
                  <h2>{weather.location.name}</h2>
                  <p className="location-detail">
                    {[weather.location.admin1, weather.location.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="current-condition">{conditions.label}</p>
                  <p className="feels-like">
                    Feels like {Math.round(weather.current.apparent_temperature)}°
                  </p>
                </div>
                <div className="temperature-block">
                  <span className="weather-emoji" aria-hidden="true">
                    {conditions.icon}
                  </span>
                  <p className="temperature">
                    {Math.round(weather.current.temperature_2m)}
                    <span>°</span>
                  </p>
                </div>
              </div>

              <div className="current-details">
                <div className="detail-item">
                  <span className="detail-icon" aria-hidden="true">↗</span>
                  <div>
                    <span className="detail-label">WIND</span>
                    <strong>{Math.round(weather.current.wind_speed_10m)} km/h</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon" aria-hidden="true">◌</span>
                  <div>
                    <span className="detail-label">HUMIDITY</span>
                    <strong>{weather.current.relative_humidity_2m}%</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon" aria-hidden="true">☂</span>
                  <div>
                    <span className="detail-label">PRECIPITATION</span>
                    <strong>{weather.current.precipitation} mm</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon" aria-hidden="true">◉</span>
                  <div>
                    <span className="detail-label">UV INDEX</span>
                    <strong>{daily.uv_index_max[0]}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="forecast-card" aria-labelledby="forecast-heading">
              <div className="section-heading">
                <div>
                  <p className="eyebrow card-eyebrow">PLAN AHEAD</p>
                  <h2 id="forecast-heading">5-day forecast</h2>
                </div>
                <span className="forecast-unit">°C</span>
              </div>
              <div className="forecast-list">
                {daily.time.map((date, index) => {
                  const forecastConditions = describeWeather(
                    daily.weather_code[index],
                  );
                  return (
                    <article className="forecast-day" key={date}>
                      <h3>{getDayName(date, index)}</h3>
                      <span className="forecast-icon" aria-label={forecastConditions.label}>
                        {forecastConditions.icon}
                      </span>
                      <p className="forecast-condition">{forecastConditions.label}</p>
                      <p className="forecast-temperatures">
                        <strong>{Math.round(daily.temperature_2m_max[index])}°</strong>
                        <span>{Math.round(daily.temperature_2m_min[index])}°</span>
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        <footer className="attribution">
          <span>Made for wherever the day takes you.</span>
          <span>
            Weather data by{' '}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}

export default WeatherDashboard;
