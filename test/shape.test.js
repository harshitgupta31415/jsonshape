import test from "node:test";
import assert from "node:assert/strict";
import { comparePayloads, inferShape } from "../lib/shape.js";

test("detects removed fields and type changes", () => {
  const result = comparePayloads(
    { id: 1, profile: { name: "Ada", active: true } },
    { id: "1", profile: { active: true } },
  );
  assert.deepEqual(
    result.changes.map(({ path, severity }) => [path, severity]),
    [["$.id", "breaking"], ["$.profile.name", "breaking"]],
  );
});

test("reports newly added fields as additive", () => {
  const result = comparePayloads({ id: 1 }, { id: 1, traceId: "abc" });
  assert.deepEqual(result.changes, [
    { path: "$.traceId", severity: "additive", message: "field was added" },
  ]);
});

test("array samples merge object fields as optional", () => {
  const shape = inferShape([{ id: 1, label: "a" }, { id: 2 }]);
  assert.equal(shape.items.properties.id.optional, false);
  assert.equal(shape.items.properties.label.optional, true);
});

test("empty arrays accept an unknown item shape", () => {
  const result = comparePayloads({ items: [] }, { items: [{ id: 1 }] });
  assert.deepEqual(result.changes, []);
});
