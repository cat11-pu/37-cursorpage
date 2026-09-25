import fs from "node:fs";
import { order } from "./sort.js";
import { encode, page } from "./cursor.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/pages.json", "utf8"));
let cursor = null;
let guard = 0;
let current = order(spec.items);
const pages = [];
while (guard < 100) {
  guard += 1;
  const result = page(current, cursor, spec.page_size);
  pages.push(result.items.map((item) => item.id));
  if (!result.next || result.items.length < spec.page_size) break;
  cursor = encode(result.next);
}
const out = render(spec);

emit("每页内容 =", pages);
emit("翻页是否恰好覆盖每个元素一次 =", out.covered);
emit("重复出现的元素 =", out.duplicated);
emit("漏掉的元素 =", out.missed);
emit("旧游标在插入后是否仍有效 =", out.stable);
emit("游标损坏的错误码 =", spec.bad_cursor_code);


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "每页内容": [
    [
      "a",
      "b"
    ],
    [
      "c",
      "d"
    ],
    [
      "e"
    ]
  ],
  "翻页是否恰好覆盖每个元素一次": true,
  "重复出现的元素": [],
  "漏掉的元素": [],
  "旧游标在插入后是否仍有效": true,
  "游标损坏的错误码": "E_BAD_CURSOR"
};
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (JSON.stringify(got) === JSON.stringify(want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
