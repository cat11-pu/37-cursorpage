// app.js：渲染结果
import { order } from "./sort.js";
import { encode, decode, parse, compareKeys, page } from "./cursor.js";

// 旧游标在（可能已插入/删除的）新数组里是否仍指向正确的续传位置：
// 前一个元素键 <= 游标键，且后一个元素键 > 游标键（数组有序，边界对则整体对）
function cursorStillValid(cursor, items) {
  const start = decode(cursor, items);
  const key = parse(cursor);
  const beforeOk = start === 0 || compareKeys(items[start - 1], key) <= 0;
  const afterOk = start >= items.length || compareKeys(items[start], key) > 0;
  return beforeOk && afterOk;
}

// 模拟边翻页边应用 spec.mutations，校验每一步旧游标仍然有效
function checkStability(spec) {
  const mutations = Array.isArray(spec.mutations) ? spec.mutations : [];
  let items = order(spec.items);
  let cursor = null;
  let guard = 0;
  const maxPages = items.length + mutations.length + 2;
  try {
    for (let index = 0; guard < maxPages; index += 1) {
      guard += 1;
      const result = page(items, cursor, spec.page_size);
      for (const mutation of mutations) {
        if (mutation.after_page !== index) continue;
        if (mutation.op === "insert") items = order(items.concat([mutation.item]));
        if (mutation.op === "delete") items = items.filter((item) => item.id !== mutation.item.id);
      }
      if (!result.next || result.items.length < spec.page_size) break;
      cursor = encode(result.next);
      if (!cursorStillValid(cursor, items)) return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function render(spec) {
  const sorted = order(spec.items);
  const pages = [];
  let cursor = null;
  let guard = 0;
  const maxPages = Math.ceil(sorted.length / spec.page_size) + 1;
  while (guard < maxPages) {
    guard += 1;
    const result = page(sorted, cursor, spec.page_size);
    if (result.items.length === 0) break;
    pages.push(result.items.map((item) => item.id));
    if (!result.next) break;
    cursor = encode(result.next);
  }
  const seen = pages.flat();
  const counts = new Map();
  for (const id of seen) counts.set(id, (counts.get(id) || 0) + 1);
  const duplicated = [];
  for (const [id, count] of counts) if (count > 1) duplicated.push(id);
  const missed = spec.items.map((item) => item.id).filter((id) => !counts.has(id));
  const covered = seen.length === spec.items.length && duplicated.length === 0 && missed.length === 0;
  return { pages: pages, covered: covered, duplicated: duplicated,
           missed: missed, stable: checkStability(spec) };
}
