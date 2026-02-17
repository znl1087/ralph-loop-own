---
description: "Explain Ralph Dev Loop plugin and available commands"
---

# Ralph Dev Loop Plugin Help

Please explain the following to the user:

## What is Ralph Dev Loop?

Ralph Dev Loop combines two powerful concepts:
1. **Ralph Loop** (the Ralph Wiggum technique) - self-referential iteration where the same prompt is fed repeatedly
2. **Anthropic's Long-Running Agent Harness** - structured progress tracking with Initializer + Coding Agent architecture

**Core concept:** Run Claude in an autonomous loop with structured session protocol. Each iteration: orient, select feature, implement, test, commit, repeat.

**Each iteration:**
1. Claude receives the SAME prompt
2. Follows the session protocol (orient → select → implement → test → commit)
3. Tries to exit
4. Stop hook intercepts and feeds the same prompt again
5. Claude sees its previous work in files, git history, and progress tracking
6. Iteratively implements features until completion

## Available Commands

### /ralph-dev-loop <PROMPT> [OPTIONS]

Start a Ralph dev loop in your current session.

**Usage:**
```
/ralph-dev-loop "Build the todo API" --completion-promise "ALL FEATURES COMPLETE" --max-iterations 30
/ralph-dev-loop "Fix auth bugs" --max-iterations 10
```

**Options:**
- `--max-iterations <n>` - Max iterations before auto-stop (default: unlimited)
- `--completion-promise <text>` - Promise phrase to signal completion

### /ralph-dev-loop --init

Interactive initialization mode. Creates project scaffolding:
- `feature_list.json` - structured feature list with verification steps
- `claude-progress.txt` - session progress log
- `init.sh` / `init.cmd` - environment setup scripts

**Usage:**
```
/ralph-dev-loop --init
```

### /cancel-ralph-dev

Cancel an active Ralph dev loop (removes the loop state file).

**Usage:**
```
/cancel-ralph-dev
```

---

## Key Concepts

### Session Protocol

Every iteration follows an 8-step protocol:
1. **Orient** - Read progress, git log, feature list
2. **Assess Environment** - Run init script, health checks
3. **Select Feature** - Pick highest-priority uncompleted feature
4. **Implement** - Build the feature (one at a time!)
5. **Test** - End-to-end verification
6. **Update Progress** - Mark feature, update progress file, git commit
7. **Assess Completion** - Check if all features done
8. **Exit** - Stop hook catches and loops back

### Feature List

JSON file tracking all features with `passes: true/false`:
```json
{
  "features": [
    {
      "id": 1,
      "category": "functional",
      "description": "User can create a new todo",
      "steps": ["POST /api/todos returns 201", "Todo appears in GET /api/todos"],
      "passes": false
    }
  ]
}
```

### Completion Promises

To signal completion, Claude must output a `<promise>` tag:
```
<promise>ALL FEATURES COMPLETE</promise>
```

### Stuck Feature Escape Hatch

If a feature can't be completed after 3 iterations:
- Log the blocker in `claude-progress.txt`
- Skip to the next feature
- Prevents infinite loops on impossible features

## When to Use

**Good for:**
- Greenfield projects with well-defined feature lists
- Multi-feature implementations requiring systematic progress
- Tasks benefiting from structured iteration and progress tracking
- Projects needing reliable, incremental development

**Not good for:**
- Quick one-shot fixes
- Tasks requiring human judgment or design decisions
- Debugging production issues
- Tasks with unclear requirements

## Example Workflow

```
# 1. Initialize project scaffolding
/ralph-dev-loop --init

# 2. (Claude helps you define features in feature_list.json)

# 3. Start the autonomous loop
/ralph-dev-loop "Build the todo app following feature_list.json. Use React + Express. Run tests with npm test." --completion-promise "ALL FEATURES COMPLETE" --max-iterations 30
```

## References

- Ralph Wiggum technique: https://ghuntley.com/ralph/
- Anthropic's long-running agents: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
