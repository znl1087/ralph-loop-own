---
description: "Cancel active Ralph Dev Loop"
allowed-tools: ["Bash(test -f .claude/ralph-dev-loop.local.md:*)", "Bash(rm .claude/ralph-dev-loop.local.md)", "Read(.claude/ralph-dev-loop.local.md)"]
hide-from-slash-command-tool: "true"
---

# Cancel Ralph Dev Loop

To cancel the Ralph dev loop:

1. Check if `.claude/ralph-dev-loop.local.md` exists using Bash: `test -f .claude/ralph-dev-loop.local.md && echo "EXISTS" || echo "NOT_FOUND"`

2. **If NOT_FOUND**: Say "No active Ralph dev loop found."

3. **If EXISTS**:
   - Read `.claude/ralph-dev-loop.local.md` to get the current iteration number from the `iteration:` field
   - Remove the file using Bash: `rm .claude/ralph-dev-loop.local.md`
   - Report: "Cancelled Ralph dev loop (was at iteration N)" where N is the iteration value
