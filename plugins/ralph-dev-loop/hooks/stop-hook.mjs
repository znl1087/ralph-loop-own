#!/usr/bin/env node

// Ralph Dev Loop Stop Hook (Cross-platform Node.js ESM)
// Prevents session exit when a ralph-dev-loop is active.
// Feeds Claude's output back as input to continue the loop.
// Pure Node.js - no external dependencies.

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

const STATE_FILE = join('.claude', 'ralph-dev-loop.local.md');

// Read all stdin (hook input JSON with transcript_path)
async function readStdin() {
  const rl = createInterface({ input: process.stdin });
  const lines = [];
  for await (const line of rl) {
    lines.push(line);
  }
  return lines.join('\n');
}

// Parse YAML frontmatter from markdown (between --- delimiters)
function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return { frontmatter: {}, body: content };

  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) return { frontmatter: {}, body: content };

  const frontmatter = {};
  for (let i = 1; i < endIdx; i++) {
    const match = lines[i].match(/^(\w+):\s*(.*)$/);
    if (match) {
      let value = match[2].trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[match[1]] = value;
    }
  }

  // Body is everything after the closing ---
  const body = lines.slice(endIdx + 1).join('\n').trim();
  return { frontmatter, body };
}

// Extract last assistant message text from JSONL transcript
function extractLastAssistantMessage(transcriptPath) {
  const content = readFileSync(transcriptPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  let lastAssistantLine = null;
  for (const line of lines) {
    if (line.includes('"role":"assistant"') || line.includes('"role": "assistant"')) {
      lastAssistantLine = line;
    }
  }

  if (!lastAssistantLine) return null;

  try {
    const parsed = JSON.parse(lastAssistantLine);
    const textParts = (parsed.message?.content || [])
      .filter(c => c.type === 'text')
      .map(c => c.text);
    return textParts.join('\n');
  } catch {
    return null;
  }
}

// Extract text from <promise> tags
function extractPromiseText(text) {
  const match = text.match(/<promise>([\s\S]*?)<\/promise>/);
  if (!match) return null;
  return match[1].trim().replace(/\s+/g, ' ');
}

// Update iteration count in state file
function updateIteration(content, newIteration) {
  return content.replace(/^iteration:\s*.*/m, `iteration: ${newIteration}`);
}

// Output JSON result and exit
function output(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

// Allow exit (no output needed)
function allowExit() {
  process.exit(0);
}

// Stop loop with warning and cleanup
function stopWithWarning(msg) {
  process.stderr.write(msg + '\n');
  if (existsSync(STATE_FILE)) {
    unlinkSync(STATE_FILE);
  }
  process.exit(0);
}

async function main() {
  // Check if ralph-dev-loop is active
  if (!existsSync(STATE_FILE)) {
    allowExit();
    return;
  }

  // Read state file
  let stateContent;
  try {
    stateContent = readFileSync(STATE_FILE, 'utf-8');
  } catch (err) {
    stopWithWarning(`\u26a0\ufe0f  Ralph dev loop: Cannot read state file: ${err.message}`);
    return;
  }

  const { frontmatter, body: promptText } = parseFrontmatter(stateContent);

  // Validate iteration
  const iteration = parseInt(frontmatter.iteration, 10);
  if (isNaN(iteration)) {
    stopWithWarning(
      `\u26a0\ufe0f  Ralph dev loop: State file corrupted\n` +
      `   File: ${STATE_FILE}\n` +
      `   Problem: 'iteration' field is not a valid number (got: '${frontmatter.iteration}')\n\n` +
      `   Ralph dev loop is stopping. Run /ralph-dev-loop again to start fresh.`
    );
    return;
  }

  // Validate max_iterations
  const maxIterations = parseInt(frontmatter.max_iterations, 10);
  if (isNaN(maxIterations)) {
    stopWithWarning(
      `\u26a0\ufe0f  Ralph dev loop: State file corrupted\n` +
      `   File: ${STATE_FILE}\n` +
      `   Problem: 'max_iterations' field is not a valid number (got: '${frontmatter.max_iterations}')\n\n` +
      `   Ralph dev loop is stopping. Run /ralph-dev-loop again to start fresh.`
    );
    return;
  }

  // Check if max iterations reached
  if (maxIterations > 0 && iteration >= maxIterations) {
    process.stderr.write(`\ud83d\uded1 Ralph dev loop: Max iterations (${maxIterations}) reached.\n`);
    unlinkSync(STATE_FILE);
    allowExit();
    return;
  }

  // Read hook input from stdin
  let hookInput;
  try {
    const rawInput = await readStdin();
    hookInput = JSON.parse(rawInput);
  } catch {
    stopWithWarning(`\u26a0\ufe0f  Ralph dev loop: Failed to parse hook input from stdin`);
    return;
  }

  const transcriptPath = hookInput.transcript_path;
  if (!transcriptPath || !existsSync(transcriptPath)) {
    stopWithWarning(
      `\u26a0\ufe0f  Ralph dev loop: Transcript file not found\n` +
      `   Expected: ${transcriptPath}\n` +
      `   Ralph dev loop is stopping.`
    );
    return;
  }

  // Extract last assistant message
  const lastOutput = extractLastAssistantMessage(transcriptPath);
  if (!lastOutput) {
    stopWithWarning(
      `\u26a0\ufe0f  Ralph dev loop: No assistant messages found in transcript\n` +
      `   Transcript: ${transcriptPath}\n` +
      `   Ralph dev loop is stopping.`
    );
    return;
  }

  // Check for completion promise
  const completionPromise = frontmatter.completion_promise;
  if (completionPromise && completionPromise !== 'null') {
    const promiseText = extractPromiseText(lastOutput);
    if (promiseText && promiseText === completionPromise) {
      process.stderr.write(`\u2705 Ralph dev loop: Detected <promise>${completionPromise}</promise>\n`);
      unlinkSync(STATE_FILE);
      allowExit();
      return;
    }
  }

  // Validate prompt text
  if (!promptText) {
    stopWithWarning(
      `\u26a0\ufe0f  Ralph dev loop: State file corrupted or incomplete\n` +
      `   File: ${STATE_FILE}\n` +
      `   Problem: No prompt text found\n\n` +
      `   Ralph dev loop is stopping. Run /ralph-dev-loop again to start fresh.`
    );
    return;
  }

  // Continue loop - update iteration
  const nextIteration = iteration + 1;
  const updatedContent = updateIteration(stateContent, nextIteration);
  writeFileSync(STATE_FILE, updatedContent, 'utf-8');

  // Build system message
  let systemMsg;
  if (completionPromise && completionPromise !== 'null') {
    systemMsg = `\ud83d\udd04 Ralph dev loop iteration ${nextIteration} | To stop: output <promise>${completionPromise}</promise> (ONLY when statement is TRUE - do not lie to exit!)`;
  } else {
    systemMsg = `\ud83d\udd04 Ralph dev loop iteration ${nextIteration} | No completion promise set - loop runs until --max-iterations`;
  }

  // Block exit and feed prompt back
  output({
    decision: 'block',
    reason: promptText,
    systemMessage: systemMsg,
  });
}

main().catch(err => {
  process.stderr.write(`\u26a0\ufe0f  Ralph dev loop: Unexpected error: ${err.message}\n`);
  if (existsSync(STATE_FILE)) {
    unlinkSync(STATE_FILE);
  }
  process.exit(0);
});
