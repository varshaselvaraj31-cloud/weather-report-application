import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios');

const locationResult = {
  name: 'London',
  admin1: 'England',
  country: 'United Kingdom',
  latitude: 51.5085,
  longitude: -0.1257,
};

const forecastResult = {
  current: {
    temperature_2m: 18,
    relative_humidity_2m: 62,
    apparent_temperature: 17,
    is_day: 1,
    precipitation: 0,
    weather_code: 2,
    wind_speed_10m: 11,
  },
  daily: {
    time: ['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26'],
    weather_code: [2, 3, 61, 0, 45],
    temperature_2m_max: [19, 17, 15, 18, 16],
    temperature_2m_min: [12, 11, 10, 9, 10],
    sunrise: [],
    sunset: [],
    uv_index_max: [2, 2, 1, 3, 2],
  },
};

beforeEach(() => {
  axios.get.mockImplementation((url) => {
    if (url.includes('geocoding')) {
      return Promise.resolve({ data: { results: [locationResult] } });
    }
    return Promise.resolve({ data: forecastResult });
  });
  axios.isCancel.mockReturnValue(false);
});

afterEach(() => {
  jest.clearAllMocks();
});

test('loads and displays current conditions and a five-day forecast', async () => {
  render(<App />);

  expect(
    await screen.findByRole('heading', { name: 'London' }),
  ).toBeInTheDocument();
  expect(screen.getByText('18')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '5-day forecast' })).toBeInTheDocument();
  expect(screen.getByText('HUMIDITY')).toBeInTheDocument();
});

test('searches for the submitted city', async () => {
  render(<App />);
  await screen.findByRole('heading', { name: 'London' });

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search for a city' }), {
    target: { value: 'Paris' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('geocoding-api.open-meteo.com'),
      expect.objectContaining({
        params: expect.objectContaining({ name: 'Paris' }),
      }),
    );
  });
});

test('shows a helpful message when the city cannot be found', async () => {
  axios.get.mockResolvedValueOnce({ data: { results: [] } });
  render(<App />);

  expect(
    await screen.findByRole('alert'),
  ).toHaveTextContent(/couldn't find "London"/i);
});
