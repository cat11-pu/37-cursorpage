// sort.js：排序（分数降序，同分按编号升序，保证游标可定位）
export function compareItems(left, right) {
  if (left.score !== right.score) return right.score - left.score;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

export function order(items) {
  return items.slice().sort(compareItems);
}
