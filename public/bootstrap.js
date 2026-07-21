(() => {
  let preferences = {};
  try {
    preferences = JSON.parse(localStorage.getItem('parktrack:preferences:v1') || '{}');
  } catch {
    // Invalid persisted preferences are ignored in favour of browser defaults.
  }

  const language =
    preferences.language === 'en' || preferences.language === 'ru'
      ? preferences.language
      : navigator.language.toLowerCase().startsWith('en')
        ? 'en'
        : 'ru';
  const theme =
    preferences.theme === 'dark' || preferences.theme === 'light'
      ? preferences.theme
      : matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

  document.documentElement.lang = language;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  document.title =
    language === 'en'
      ? 'ParkTrack — Available parking map'
      : 'ParkTrack — Карта свободных парковок';

  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.content =
      language === 'en'
        ? 'ParkTrack — available parking map with occupancy forecasts'
        : 'ParkTrack — карта свободных парковок с прогнозом занятости';
  }
})();
