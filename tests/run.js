import assert from "node:assert";
import { order } from "../sort.js";
import { encode, decode, page } from "../cursor.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const items = [{ id: "a", score: 3 }, { id: "b", score: 3 }, { id: "c", score: 1 }];

check("order sorts by score", () => {
  assert.strictEqual(order(items)[0].score, 3);
});

check("order returns all items", () => {
  assert.strictEqual(order(items).length, 3);
});

check("encode returns a string", () => {
  assert.strictEqual(typeof encode(items[0]), "string");
});

check("decode finds the item", () => {
  assert.strictEqual(decode("3", order(items)), 0);
});

check("page returns items and next", () => {
  const result = page(order(items), null, 2);
  assert.ok(Array.isArray(result.items) && result.next !== undefined);
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
