function primitiveType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function clone(schema) {
  return JSON.parse(JSON.stringify(schema));
}

function signature(schema) {
  if (schema.kind === "object") return "object";
  if (schema.kind === "array") return `array:${signature(schema.items)}`;
  if (schema.kind === "union") return `union:${schema.options.map(signature).sort().join("|")}`;
  return schema.kind;
}

function union(left, right) {
  if (signature(left) === signature(right)) return merge(left, right);
  const options = [];
  for (const candidate of [left, right]) {
    const members = candidate.kind === "union" ? candidate.options : [candidate];
    for (const member of members) {
      if (!options.some((existing) => signature(existing) === signature(member))) {
        options.push(clone(member));
      }
    }
  }
  return { kind: "union", options };
}

function merge(left, right) {
  if (signature(left) !== signature(right)) return union(left, right);
  if (left.kind === "object") {
    const properties = {};
    const keys = new Set([...Object.keys(left.properties), ...Object.keys(right.properties)]);
    for (const key of keys) {
      const l = left.properties[key];
      const r = right.properties[key];
      if (l && r) {
        properties[key] = {
          optional: l.optional || r.optional,
          schema: merge(l.schema, r.schema),
        };
      } else {
        const value = clone((l || r));
        value.optional = true;
        properties[key] = value;
      }
    }
    return { kind: "object", properties };
  }
  if (left.kind === "array") return { kind: "array", items: merge(left.items, right.items) };
  if (left.kind === "union") {
    return left.options.reduce((result, option) => union(result, option), right);
  }
  return clone(left);
}

export function inferShape(value) {
  const kind = primitiveType(value);
  if (kind === "object") {
    const properties = {};
    for (const [key, child] of Object.entries(value)) {
      properties[key] = { optional: false, schema: inferShape(child) };
    }
    return { kind, properties };
  }
  if (kind === "array") {
    if (value.length === 0) return { kind, items: { kind: "unknown" } };
    return { kind, items: value.map(inferShape).reduce(merge) };
  }
  return { kind };
}

function accepts(expected, actual) {
  if (expected.kind === "unknown" || actual.kind === "unknown") return true;
  if (expected.kind === "union") {
    return expected.options.some((option) => accepts(option, actual));
  }
  if (actual.kind === "union") {
    return actual.options.every((option) => accepts(expected, option));
  }
  return expected.kind === actual.kind;
}

export function diffShapes(expected, actual, path = "$") {
  const changes = [];
  if (!accepts(expected, actual)) {
    return [{ path, severity: "breaking", message: `type changed from ${signature(expected)} to ${signature(actual)}` }];
  }

  if (expected.kind === "object" && actual.kind === "object") {
    for (const [key, field] of Object.entries(expected.properties)) {
      const nextPath = `${path}.${key}`;
      const candidate = actual.properties[key];
      if (!candidate) {
        changes.push({ path: nextPath, severity: "breaking", message: "field was removed" });
        continue;
      }
      if (!field.optional && candidate.optional) {
        changes.push({ path: nextPath, severity: "breaking", message: "field became optional" });
      }
      changes.push(...diffShapes(field.schema, candidate.schema, nextPath));
    }
    for (const key of Object.keys(actual.properties)) {
      if (!(key in expected.properties)) {
        changes.push({ path: `${path}.${key}`, severity: "additive", message: "field was added" });
      }
    }
  } else if (expected.kind === "array" && actual.kind === "array") {
    changes.push(...diffShapes(expected.items, actual.items, `${path}[]`));
  }
  return changes;
}

export function comparePayloads(baseline, candidate) {
  const baselineShape = inferShape(baseline);
  const candidateShape = inferShape(candidate);
  return {
    baselineShape,
    candidateShape,
    changes: diffShapes(baselineShape, candidateShape),
  };
}
