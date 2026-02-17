# Session Protocol Reference

## Overview

The session protocol defines exactly what Claude must do in each iteration of the Ralph Dev Loop. It ensures reliable, incremental progress and prevents common failure modes like premature completion declaration, context exhaustion, and environment drift.

## The 8 Steps

### Step 1: Orient

**Goal:** Understand where you are and what's been done.

```
pwd                              # Confirm working directory
cat claude-progress.txt          # Read progress log
git log --oneline -20            # Recent commits
cat feature_list.json            # Feature status
```

**Why this matters:** Each iteration starts with a fresh context. Without orienting first, you risk:
- Redoing work already completed
- Working on a feature that's already passing
- Missing important context from previous iterations

**Edge case - Conflicting state:**
If `claude-progress.txt` and `git log` disagree (e.g., progress says feature 3 is done but git shows no related commits), trust `git log` as the source of truth. Update `claude-progress.txt` to match.

### Step 2: Assess Environment

**Goal:** Ensure the development environment is healthy.

```bash
# macOS/Linux
./init.sh

# Windows
init.cmd
```

Then run basic health checks:
- Does the project build?
- Do existing tests pass?
- Is the dev server running (if applicable)?

**If environment is broken:**
1. Fix environment issues FIRST before any feature work
2. Log the fix in `claude-progress.txt`
3. Commit environment fixes separately

### Step 3: Select Feature

**Goal:** Pick exactly ONE feature to work on.

Selection criteria (in priority order):
1. Features with `passes: false`
2. Infrastructure/setup features first (category: "infrastructure")
3. Then functional features
4. Then UI/polish features
5. Skip features that have been stuck for 3+ iterations

**Never work on multiple features simultaneously.** This is the #1 cause of context exhaustion and half-finished work.

### Step 4: Implement

**Goal:** Write clean, working code for the selected feature.

Guidelines:
- Follow existing project conventions (naming, structure, patterns)
- Keep changes focused on the selected feature
- Write production-quality code (not prototypes)
- Add appropriate error handling
- Create or update tests as needed

### Step 5: Test

**Goal:** Verify the feature works end-to-end.

Testing checklist:
1. Run the project's test suite (`npm test`, `pytest`, etc.)
2. Walk through each verification `step` in the feature definition
3. Verify no regressions in previously-passing features
4. Test edge cases where applicable

**Only mark a feature as passing after ALL verification steps succeed.**

Not sufficient:
- "It should work" (untested)
- Unit tests alone (no integration)
- Manual inspection only (no automated verification)

### Step 6: Update Progress

**Goal:** Record what was done and commit.

1. Update `feature_list.json`:
   ```json
   { "id": 3, "passes": true }   // Only change passes field!
   ```

2. Update `claude-progress.txt`:
   ```
   ## Session N (iteration X) - YYYY-MM-DD
   - Implemented feature: "User can create todos"
   - All verification steps passing
   - No regressions detected
   ```

3. Git commit:
   ```bash
   git add -A
   git commit -m "feat: implement todo creation (feature #3)"
   ```

**Never modify feature descriptions, steps, or categories.** Only change `passes: false` to `passes: true`.

### Step 7: Assess Completion

**Goal:** Determine if the project is done.

Check: Are ALL features in `feature_list.json` marked as `passes: true`?

- **If YES:** Output the completion promise (e.g., `<promise>ALL FEATURES COMPLETE</promise>`)
- **If NO:** Continue to Step 8 (the loop will bring you back to Step 1)

**Do NOT declare completion if any features are still `passes: false`**, even if you think they're unnecessary or impossible.

### Step 8: Exit

Simply stop working. The stop hook will:
1. Intercept the exit
2. Feed the same prompt back
3. Start a new iteration at Step 1

## Conflict Resolution

### Progress File vs Git Log Disagreement

| Situation | Resolution |
|-----------|-----------|
| Progress says done, git shows no commits | Feature NOT done, update progress |
| Git shows commits, progress says not done | Check if tests pass, update accordingly |
| Feature list says passes, tests fail | Set passes back to false |

### Lost Files

If files referenced in progress are missing:
1. Check `git log` and `git stash list`
2. If recoverable: `git checkout <commit> -- <file>`
3. If not: re-implement from progress notes
4. Log the issue in progress file

## Stuck Feature Detection

A feature is "stuck" if:
- Same feature has been the target for 3+ consecutive iterations
- No meaningful progress (tests still failing, same errors)

**Resolution:**
1. Log the blocker in `claude-progress.txt`:
   ```
   ## BLOCKER: Feature #5 - "WebSocket real-time updates"
   Stuck for 3 iterations. Issue: Cannot establish WS connection in test env.
   Skipping to next feature. May need manual intervention.
   ```
2. Move to the next uncompleted feature
3. Do NOT mark the stuck feature as passing

## Test Failure Handling

| Scenario | Action |
|----------|--------|
| New feature tests fail | Debug and fix in current iteration |
| Existing feature regressed | Fix regression BEFORE continuing |
| Flaky tests (pass sometimes) | Investigate root cause, don't ignore |
| Test infrastructure broken | Fix infrastructure first, log in progress |
| All tests timeout | Check if dev server is running, restart if needed |
