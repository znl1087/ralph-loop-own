#!/usr/bin/env node

// Ralph Dev Loop Setup Script (Cross-platform Node.js ESM)
// Creates state file for in-session Ralph dev loop.
// Pure Node.js - no external dependencies.

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Parse command-line arguments
const args = process.argv.slice(2);
const promptParts = [];
let maxIterations = 0;
let completionPromise = 'null';

let i = 0;
while (i < args.length) {
  switch (args[i]) {
    case '-h':
    case '--help':
      console.log(`Ralph Dev Loop - Autonomous development loop with structured progress tracking

USAGE:
  /ralph-dev-loop [PROMPT...] [OPTIONS]

ARGUMENTS:
  PROMPT...    Initial prompt to start the loop (can be multiple words)

OPTIONS:
  --max-iterations <n>           Maximum iterations before auto-stop (default: unlimited)
  --completion-promise '<text>'  Promise phrase to signal completion (USE QUOTES for multi-word)
  -h, --help                     Show this help message

DESCRIPTION:
  Starts a Ralph Dev Loop in your CURRENT session. The stop hook prevents
  exit and feeds your output back as input until completion or iteration limit.

  Each iteration follows the session protocol:
  1. Orient - Read progress, git log, feature list
  2. Select - Pick highest-priority uncompleted feature
  3. Implement - Build the feature
  4. Test - Run end-to-end tests
  5. Commit - Git commit with progress update
  6. Repeat until done

  To signal completion, output: <promise>YOUR_PHRASE</promise>

EXAMPLES:
  /ralph-dev-loop "Build a todo API" --completion-promise 'ALL FEATURES COMPLETE' --max-iterations 30
  /ralph-dev-loop --max-iterations 10 Fix the auth bug
  /ralph-dev-loop --init   (interactive initialization mode)

STOPPING:
  Only by reaching --max-iterations or detecting --completion-promise.

MONITORING:
  # View current iteration:
  grep 'iteration:' .claude/ralph-dev-loop.local.md

  # View full state:
  head -10 .claude/ralph-dev-loop.local.md`);
      process.exit(0);
      break;

    case '--max-iterations':
      if (!args[i + 1] || !/^\d+$/.test(args[i + 1])) {
        console.error(`\u274c Error: --max-iterations requires a positive integer, got: ${args[i + 1] || '(nothing)'}`);
        process.exit(1);
      }
      maxIterations = parseInt(args[i + 1], 10);
      i += 2;
      break;

    case '--completion-promise':
      if (!args[i + 1]) {
        console.error(`\u274c Error: --completion-promise requires a text argument`);
        console.error(`   Example: --completion-promise 'ALL FEATURES COMPLETE'`);
        process.exit(1);
      }
      completionPromise = args[i + 1];
      i += 2;
      break;

    default:
      promptParts.push(args[i]);
      i++;
      break;
  }
}

const prompt = promptParts.join(' ');

if (!prompt) {
  console.error(`\u274c Error: No prompt provided`);
  console.error(``);
  console.error(`   Ralph Dev Loop needs a task description to work on.`);
  console.error(``);
  console.error(`   Examples:`);
  console.error(`     /ralph-dev-loop Build a REST API for todos`);
  console.error(`     /ralph-dev-loop Fix the auth bug --max-iterations 20`);
  console.error(`     /ralph-dev-loop --completion-promise 'ALL FEATURES COMPLETE' Build the app`);
  console.error(``);
  console.error(`   For all options: /ralph-dev-loop --help`);
  process.exit(1);
}

// Create state file
mkdirSync(join('.claude'), { recursive: true });

const startedAt = new Date().toISOString();
const promiseYaml = completionPromise !== 'null' ? `"${completionPromise}"` : 'null';

const stateContent = `---
active: true
iteration: 1
max_iterations: ${maxIterations}
completion_promise: ${promiseYaml}
started_at: "${startedAt}"
---

${prompt}
`;

writeFileSync(join('.claude', 'ralph-dev-loop.local.md'), stateContent, 'utf-8');

// Output setup message
const maxIterStr = maxIterations > 0 ? String(maxIterations) : 'unlimited';
const promiseStr = completionPromise !== 'null'
  ? `${completionPromise} (ONLY output when TRUE - do not lie!)`
  : 'none (runs forever)';

console.log(`\ud83d\udd04 Ralph dev loop activated in this session!

Iteration: 1
Max iterations: ${maxIterStr}
Completion promise: ${promiseStr}

The stop hook is now active. When you try to exit, the SAME PROMPT will be
fed back to you. You'll see your previous work in files, creating a
self-referential loop where you iteratively improve on the same task.

To monitor: head -10 .claude/ralph-dev-loop.local.md

\u26a0\ufe0f  WARNING: This loop cannot be stopped manually! It will run infinitely
    unless you set --max-iterations or --completion-promise.

\ud83d\udd04`);

// Output the initial prompt
console.log('');
console.log(prompt);

// Display completion promise requirements if set
if (completionPromise !== 'null') {
  console.log(`
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
CRITICAL - Ralph Dev Loop Completion Promise
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

To complete this loop, output this EXACT text:
  <promise>${completionPromise}</promise>

STRICT REQUIREMENTS (DO NOT VIOLATE):
  \u2713 Use <promise> XML tags EXACTLY as shown above
  \u2713 The statement MUST be completely and unequivocally TRUE
  \u2713 Do NOT output false statements to exit the loop
  \u2713 Do NOT lie even if you think you should exit

IMPORTANT - Do not circumvent the loop:
  Even if you believe you're stuck, the task is impossible,
  or you've been running too long - you MUST NOT output a
  false promise statement. The loop is designed to continue
  until the promise is GENUINELY TRUE. Trust the process.

  If the loop should stop, the promise statement will become
  true naturally. Do not force it by lying.
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`);
}
