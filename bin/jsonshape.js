#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { comparePayloads } from "../lib/shape.js";

function usage() {
  return `Usage: jsonshape <baseline.json> <candidate.json> [--mode compatible|exact] [--json]

Modes:
  compatible  Fail only on breaking structural changes (default)
  exact       Fail on any structural change`;
}

function parseArgs(argv) {
  const positional = [];
  let mode = "compatible";
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--json") json = true;
    else if (value === "--mode") mode = argv[++index];
    else if (value === "--help" || value === "-h") return { help: true };
    else positional.push(value);
  }
  if (!["compatible", "exact"].includes(mode)) throw new Error(`unknown mode: ${mode}`);
  if (positional.length !== 2) throw new Error("two JSON files are required");
  return { baseline: positional[0], candidate: positional[1], mode, json };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`jsonshape: ${error.message}\n\n${usage()}`);
    return 2;
  }
  if (args.help) {
    console.log(usage());
    return 0;
  }

  try {
    const result = comparePayloads(await readJson(args.baseline), await readJson(args.candidate));
    const relevant = args.mode === "exact" ? result.changes : result.changes.filter((change) => change.severity === "breaking");
    if (args.json) {
      console.log(JSON.stringify({ compatible: relevant.length === 0, mode: args.mode, changes: result.changes }, null, 2));
    } else if (result.changes.length === 0) {
      console.log("jsonshape: payload structures match");
    } else {
      for (const change of result.changes) {
        console.log(`${change.severity.padEnd(8)} ${change.path} — ${change.message}`);
      }
    }
    return relevant.length === 0 ? 0 : 1;
  } catch (error) {
    console.error(`jsonshape: ${error.message}`);
    return 2;
  }
}

process.exitCode = await main();
