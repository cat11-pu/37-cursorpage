// cursor.js：游标（复合键 = 分数 + 编号；分页只做二分定位 + 切片，不重排）
const SEP = ":";

function badCursor(cursor) {
  const error = new Error("E_BAD_CURSOR: 无法解析的游标 " + JSON.stringify(cursor));
  error.code = "E_BAD_CURSOR";
  return error;
}

// 比较两个键（item 或解析后的游标，都是 {score, id} 形状）：分数降序、同分编号升序
export function compareKeys(left, right) {
  if (left.score !== right.score) return right.score - left.score;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

export function encode(item) {
  return String(item.score) + SEP + String(item.id);
}

// 解析游标为复合键；格式损坏抛 E_BAD_CURSOR，绝不静默回第一页
export function parse(cursor) {
  if (typeof cursor !== "string" || cursor.length === 0) throw badCursor(cursor);
  const at = cursor.indexOf(SEP);
  const scoreText = at < 0 ? cursor : cursor.slice(0, at);
  const id = at < 0 ? "" : cursor.slice(at + 1);
  if (scoreText.trim() === "" || !Number.isFinite(Number(scoreText))) throw badCursor(cursor);
  return { score: Number(scoreText), id: id };
}

// 在已排序数组里二分出「严格大于游标键」的第一个下标（即续传起点）
export function decode(cursor, items) {
  const key = parse(cursor);
  let lo = 0;
  let hi = items.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (compareKeys(items[mid], key) > 0) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export function page(items, cursor, size) {
  const start = cursor === null || cursor === undefined ? 0 : decode(cursor, items);
  const slice = items.slice(start, start + size);
  const hasMore = start + size < items.length;
  return { items: slice, next: hasMore && slice.length > 0 ? slice[slice.length - 1] : null };
}
