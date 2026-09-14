#!/usr/bin/env node
/**
 * Catches two classes of SQL error that only show up when you paste a file
 * into the SQL editor. The first is a bare apostrophe inside a single-quoted
 * literal. The second is a column named with a reserved word, such as
 * "leading" or "user", which fails unless quoted.
 *
 *   'The design should speak the users' language, ...'
 *                                    ^ ends the string here
 *
 * Postgres then reads the next word as an identifier and fails with a syntax
 * error hundreds of lines from the real mistake. The fix is always to double
 * the apostrophe.
 *
 * The scanner walks the file tracking three states, because an apostrophe is
 * harmless in two of them: line comments, and dollar-quoted bodies with any
 * tag ($$, $fx$, $verify$).
 *
 *   node scripts/verify/sql-lint.mjs [files...]
 *
 * With no arguments it checks every migration and verification script.
 */

import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const Q = "'";

function scan(source) {
  const issues = [];
  let i = 0;
  let line = 1;
  const n = source.length;

  while (i < n) {
    const c = source[i];

    if (c === "\n") {
      line++;
      i++;
      continue;
    }

    // Line comment: everything to the newline is text.
    if (source.startsWith("--", i)) {
      const j = source.indexOf("\n", i);
      i = j < 0 ? n : j;
      continue;
    }

    // Block comment.
    if (source.startsWith("/*", i)) {
      const j = source.indexOf("*/", i + 2);
      if (j < 0) {
        issues.push({ line, message: "unterminated /* block comment" });
        break;
      }
      line += countNewlines(source, i, j + 2);
      i = j + 2;
      continue;
    }

    // Dollar-quoted body, any tag. Apostrophes inside need no escaping.
    const tag = matchDollarTag(source, i);
    if (tag) {
      const j = source.indexOf(tag, i + tag.length);
      if (j < 0) {
        issues.push({ line, message: `unterminated ${tag} block` });
        break;
      }
      line += countNewlines(source, i, j + tag.length);
      i = j + tag.length;
      continue;
    }

    // A single-quoted literal. '' inside is one escaped apostrophe.
    if (c === Q) {
      const startLine = line;
      i++;
      let closed = false;
      while (i < n) {
        if (source[i] === Q) {
          if (source[i + 1] === Q) {
            i += 2;
            continue;
          }
          i++;
          closed = true;
          break;
        }
        if (source[i] === "\n") line++;
        i++;
      }
      if (!closed) {
        issues.push({
          line: startLine,
          message:
            "string literal is never closed; an apostrophe here probably needs doubling",
        });
      } else if (line - startLine > 2) {
        issues.push({
          line: startLine,
          message: `string literal runs to line ${line}; a bare apostrophe usually causes this`,
        });
      }
      continue;
    }

    i++;
  }

  return issues;
}

// PostgreSQL's fully reserved key words: these cannot name a column unquoted.
// https://www.postgresql.org/docs/current/sql-keywords-appendix.html
const RESERVED = new Set(`all analyse analyze and any array as asc asymmetric
both case cast check collate column constraint create current_catalog
current_date current_role current_time current_timestamp current_user default
deferrable desc distinct do else end except false fetch for foreign from grant
group having in initially intersect into lateral leading limit localtime
localtimestamp not null offset on only or order placing primary references
returning select session_user some symmetric system_user table then to
trailing true union unique user using variadic when where window with`
  .split(/\s+/).filter(Boolean));

/**
 * Column names declared in CREATE TABLE bodies and ADD COLUMN clauses that are
 * reserved. Comments are stripped first so prose cannot trigger it.
 */
function reservedColumns(source) {
  const issues = [];
  const lines = source.split("\n");
  let inTable = false;
  lines.forEach((raw, idx) => {
    const line = raw.replace(/--.*$/, "");
    if (/CREATE TABLE/i.test(line)) inTable = true;
    const add = line.match(/ADD COLUMN\s+(?:IF NOT EXISTS\s+)?([a-z_]+)/i);
    if (add && RESERVED.has(add[1].toLowerCase())) {
      issues.push({ line: idx + 1, message: `column "${add[1]}" is a reserved word; rename or quote it` });
    }
    if (inTable) {
      const col = line.match(/^\s+([a-z_]+)\s+(uuid|text|int|integer|smallint|bigint|boolean|bool|numeric|real|jsonb?|timestamptz|timestamp|date|serial)\b/i);
      if (col && RESERVED.has(col[1].toLowerCase())) {
        issues.push({ line: idx + 1, message: `column "${col[1]}" is a reserved word; rename or quote it` });
      }
      if (/^\s*\);/.test(line)) inTable = false;
    }
  });
  return issues;
}

function matchDollarTag(s, i) {
  if (s[i] !== "$") return null;
  let j = i + 1;
  while (j < s.length && /[A-Za-z_]/.test(s[j])) j++;
  return s[j] === "$" ? s.slice(i, j + 1) : null;
}

function countNewlines(s, from, to) {
  let n = 0;
  for (let k = from; k < to; k++) if (s[k] === "\n") n++;
  return n;
}

const files =
  process.argv.length > 2
    ? process.argv.slice(2)
    : [
        ...globSync("supabase/migrations/*.sql"),
        ...globSync("scripts/**/*.sql"),
      ].sort();

let failed = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const issues = [...scan(text), ...reservedColumns(text)];
  if (issues.length === 0) {
    console.log(`  ok    ${file}`);
  } else {
    failed++;
    for (const { line, message } of issues) {
      console.log(`  FAIL  ${file}:${line}  ${message}`);
    }
  }
}

console.log(
  failed === 0
    ? `\n${files.length} files, no quoting or reserved-word problems.`
    : `\n${failed} of ${files.length} files have problems.`,
);
process.exit(failed === 0 ? 0 : 1);
