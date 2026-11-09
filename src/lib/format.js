export const pad2 = (n) => String(n).padStart(2, '0');

export const mmss = (sec) => Math.floor(sec / 60) + ':' + pad2(Math.floor(sec % 60));

// 21.05
export const clockText = (date) => pad2(date.getHours()) + '.' + pad2(date.getMinutes());

export const utcLabel = (date) => {
  const off = -date.getTimezoneOffset();
  const om = Math.abs(off);
  return 'UTC' + (off < 0 ? '-' : '+') + Math.floor(om / 60) + (om % 60 ? ':' + pad2(om % 60) : '');
};

export const dayPartOf = (hour) =>
  hour < 5 ? 'night'
    : hour < 9 ? 'early morning'
    : hour < 12 ? 'morning'
    : hour < 17 ? 'afternoon'
    : hour < 21 ? 'evening'
    : 'night';

export const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

export const ago = (ms) => {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return sec + 's';
  const m = Math.floor(sec / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  if (h < 48) return h + 'h';
  return Math.floor(h / 24) + 'd';
};
