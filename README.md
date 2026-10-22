# Atmos Weather

A responsive React weather app for searching a city and viewing live conditions
with a five-day forecast.

## Live website

After the GitHub Pages deployment completes, visit
[Atmos Weather](https://varshaselvaraj31-cloud.github.io/weather-report-application/).

To enable deployment, open the repository's **Settings → Pages** and set
**Build and deployment → Source** to **GitHub Actions**. The workflow then
builds and publishes the app whenever changes are pushed to `main`.

## Run locally

```bash
npm install
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000) and loads London
as the initial example. Enter another city in the search field to update the
weather.

## Weather data

Atmos uses the free [Open-Meteo](https://open-meteo.com/) geocoding and forecast
APIs through Axios. No API key is required, so there are no credentials to add
to the client app. City names are resolved to coordinates before requesting
current conditions and the five-day forecast.

## Checks

```bash
npm test -- --watchAll=false
npm run build
```
