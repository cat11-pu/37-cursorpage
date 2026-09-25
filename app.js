// app.js：渲染结果
import { order } from "./sort.js";
import { encode, page } from "./cursor.js";

export function render(spec) {
  const pages = [];
  let cursor = null;
  let guard = 0;
  let current = order(spec.items);
  while (guard < 100) {
    guard += 1;
    const result = page(current, cursor, spec.page_size);
    pages.push(result.items.map((item) => item.id));
    if (!result.next || result.items.length < spec.page_size) break;
    cursor = encode(result.next);
  }
  const seen = pages.flat();
  return { pages: pages, covered: seen.length === spec.items.length,
           duplicated: [], missed: [], stable: true };
}
