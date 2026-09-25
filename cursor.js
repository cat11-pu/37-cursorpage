// cursor.js：游标（分数+编号复合键，从严格大于游标的位置起取）
import { compareItems } from "./sort.js";

const BAD_CURSOR = "E_BAD_CURSOR";

function badCursor() {
  const error = new Error(BAD_CURSOR);
  error.code = BAD_CURSOR;
  return error;
}

export function encode(item) {
  return JSON.stringify([item.score, item.id]);
}

function parse(cursor) {
  if (typeof cursor !== "string") throw badCursor();
  const text = cursor.trim();
  if (text.startsWith("[")) {
    let parsed;
    try { parsed = JSON.parse(text); } catch { throw badCursor(); }
    if (!Array.isArray(parsed) || parsed.length !== 2) throw badCursor();
    const score = parsed[0];
    const id = parsed[1];
    if (typeof score !== "number" || !Number.isFinite(score)) throw badCursor();
    if (typeof id !== "string" && typeof id !== "number") throw badCursor();
    return { score: score, id: id };
  }
  if (text !== "" && Number.isFinite(Number(text))) {
    return { score: Number(text), id: "" };
  }
  throw badCursor();
}

export function decode(cursor, items) {
  const key = parse(cursor);
  let lo = 0;
  let hi = items.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (compareItems(items[mid], key) <= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function page(items, cursor, size) {
  const start = cursor === null || cursor === undefined ? 0 : decode(cursor, items);
  const slice = items.slice(start, start + size);
  return { items: slice, next: slice.length === 0 ? null : slice[slice.length - 1] };
}
