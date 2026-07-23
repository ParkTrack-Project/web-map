export function formatDurationFromSeconds(seconds: number, language: 'ru' | 'en' = 'ru'): string {
  const minute = language === 'ru' ? 'мин' : 'min';
  const hour = language === 'ru' ? 'ч' : 'h';
  const day = language === 'ru' ? 'д' : 'd';
  if (!Number.isFinite(seconds) || seconds <= 0) return `1 ${minute}`;
  const totalMin = Math.max(1, Math.ceil(seconds / 60));
  if (totalMin < 60) return `${totalMin} ${minute}`;

  const totalHours = Math.floor(totalMin / 60);
  const restMin = totalMin % 60;
  if (totalHours < 24) {
    return restMin === 0 ? `${totalHours} ${hour}` : `${totalHours} ${hour} ${restMin} ${minute}`;
  }

  const days = Math.floor(totalHours / 24);
  const restHours = totalHours % 24;
  return restHours === 0 ? `${days} ${day}` : `${days} ${day} ${restHours} ${hour}`;
}
