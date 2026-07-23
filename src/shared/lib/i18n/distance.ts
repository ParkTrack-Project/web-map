export function formatDistanceFromMeters(meters: number, language: 'ru' | 'en' = 'ru'): string {
  const safeMeters = Number.isFinite(meters) ? Math.max(0, meters) : 0;
  if (safeMeters < 1000) {
    return `${Math.round(safeMeters)} ${language === 'ru' ? 'м' : 'm'}`;
  }

  const kilometers = new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(safeMeters / 1000);
  return `${kilometers} ${language === 'ru' ? 'км' : 'km'}`;
}
