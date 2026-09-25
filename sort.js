// sort.js：排序（基线：按分数排序、不稳定）
export function order(items) {
  return items.slice().sort((left, right) => right.score - left.score);
}
