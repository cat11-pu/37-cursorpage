// sort.js：排序（分数降序，同分按编号升序，保证全局有序、游标可定位）
export function order(items) {
  return items.slice().sort(function (left, right) {
    if (left.score !== right.score) return right.score - left.score;
    if (left.id === right.id) return 0;
    return left.id < right.id ? -1 : 1;
  });
}
