---
description: "Start Ralph Dev Loop - autonomous development with structured progress tracking"
argument-hint: "PROMPT [--max-iterations N] [--completion-promise TEXT] | --init"
allowed-tools: ["Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/setup-ralph-dev.mjs:*)", "Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/init-dev-project.mjs:*)", "Read", "Write", "Edit", "Bash", "Glob", "Grep"]
hide-from-slash-command-tool: "true"
---

# Ralph Dev Loop Command

This command has two modes:

## Mode 1: Init Mode (`--init`)

If the user passed `--init`, run the project initializer to create scaffolding:

```!
node "${CLAUDE_PLUGIN_ROOT}/scripts/init-dev-project.mjs" $ARGUMENTS
```

After running, help the user:
1. Read the generated `feature_list.json`
2. Ask the user to describe their project and features
3. Generate a proper feature list with granular, testable features
4. Each feature should have:
   - `id`: sequential number
   - `category`: "infrastructure", "functional", "ui", "integration", "polish"
   - `description`: clear, specific, implementable description
   - `steps`: array of concrete verification steps
   - `passes`: false (always starts false)
5. Write the feature list to `feature_list.json`
6. Customize `init.sh` / `init.cmd` for the project's tech stack
7. Suggest the next step: running `/ralph-dev-loop` with a good prompt

## Mode 2: Quick Mode (default)

Execute the setup script to initialize the Ralph dev loop:

```!
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ralph-dev.mjs" $ARGUMENTS
```

Then begin working on the task. Follow the **Session Protocol** below for each iteration.

---

## Session Protocol (CRITICAL - Follow Every Iteration)

Each iteration of the Ralph Dev Loop MUST follow this protocol:

### Step 1: Orient
- Run `pwd` to confirm working directory
- Read `claude-progress.txt` (if exists) for session history
- Read `git log --oneline -20` for recent work
- Read `feature_list.json` (if exists) for feature status

### Step 2: Assess Environment
- Run `init.sh` (or `init.cmd` on Windows) if it exists
- Run basic tests/health checks to verify environment

### Step 3: Select Feature
- Find the highest-priority uncompleted feature (`passes: false`)
- Focus on ONE feature only - never work on multiple simultaneously
- If stuck on a feature for 3+ iterations, log a blocker in `claude-progress.txt` and skip to the next feature

### Step 4: Implement
- Write clean, production-quality code
- Follow existing project conventions
- Keep changes focused on the selected feature

### Step 5: Test
- Run the project's test suite
- Perform end-to-end verification using the feature's `steps`
- Only consider a feature complete when ALL verification steps pass

### Step 6: Update Progress
- If feature passes: update `feature_list.json` setting `passes: true`
- Update `claude-progress.txt` with what was done
- Git commit with a descriptive message

### Step 7: Assess Completion
- Check if ALL features in `feature_list.json` have `passes: true`
- If yes, output the completion promise
- If no, the loop will continue to the next iteration

### Step 8: Exit
- The stop hook will intercept and feed the same prompt back
- Next iteration starts fresh with Step 1

---

## Rules

1. **One feature per iteration** - prevents context exhaustion
2. **Never modify feature descriptions** - only change `passes: false` to `passes: true`
3. **Always commit** - every iteration should end with merge-ready code
4. **Stuck escape hatch** - if 3+ iterations on the same feature, log blocker, move on
5. **No false promises** - only output `<promise>` when the statement is genuinely true
6. **Trust the loop** - the protocol ensures incremental, reliable progress

CRITICAL RULE: If a completion promise is set, you may ONLY output it when the statement is completely and unequivocally TRUE. Do not output false promises to escape the loop, even if you think you're stuck or should exit for other reasons.
