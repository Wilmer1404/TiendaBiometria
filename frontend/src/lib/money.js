// src/lib/money.js
export const money = n =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n ?? 0);
