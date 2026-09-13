#!/usr/bin/env node
/**
 * Catches the class of SQL error that only shows up when you paste a file into
 * the SQL editor: a bare apostrophe inside a single-quoted literal.
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
  const issues = scan(readFileSync(file, "utf8"));
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
    ? `\n${files.length} files, no quoting problems.`
    : `\n${failed} of ${files.length} files have problems.`,
);
process.exit(failed === 0 ? 0 : 1);
