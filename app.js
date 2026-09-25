// app.js：渲染结果
import { order } from "./sort.js";
import { encode, page } from "./cursor.js";

export function render(spec) {
  const mutations = Array.isArray(spec.mutations) ? spec.mutations.slice() : [];
  const inserts = mutations.filter((mutation) => mutation.op === "insert").length;
  const maxPages = spec.items.length + inserts + 2;
  let current = order(spec.items);
  const pages = [];
  const seen = [];
  let cursor = null;
  let stable = true;
  for (let index = 0; index < maxPages; index += 1) {
    let result;
    try {
      result = page(current, cursor, spec.page_size);
    } catch (error) {
      if (error && error.code === "E_BAD_CURSOR") { stable = false; break; }
      throw error;
    }
    if (result.items.length === 0) break;
    const ids = result.items.map((item) => item.id);
    pages.push(ids);
    seen.push(...ids);
    if (!result.next || result.items.length < spec.page_size) break;
    cursor = encode(result.next);
    for (const mutation of mutations) {
      if (mutation.after_page !== index) continue;
      if (mutation.op === "insert") current = order(current.concat([mutation.item]));
      if (mutation.op === "delete") current = current.filter((item) => item.id !== mutation.item.id);
    }
  }
  const counts = {};
  for (const id of seen) counts[id] = (counts[id] || 0) + 1;
  const duplicated = Object.keys(counts).filter((id) => counts[id] > 1);
  const missed = spec.items.map((item) => item.id).filter((id) => !counts[id]);
  const covered = duplicated.length === 0 && missed.length === 0;
  return { pages: pages, covered: covered, duplicated: duplicated, missed: missed, stable: stable };
}
