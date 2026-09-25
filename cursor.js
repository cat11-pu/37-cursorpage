// cursor.js：游标（基线：用偏移量当游标）
export function encode(item) {
  return String(item.score);
}

export function decode(cursor, items) {
  return items.findIndex((item) => String(item.score) === String(cursor));
}

export function page(items, cursor, size) {
  const start = cursor === null ? 0 : decode(cursor, items);
  return { items: items.slice(start, start + size), next: items[start + size - 1] || null };
}
