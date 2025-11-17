+++
date = "2025-11-17T07:12:48-07:00"
title = "Split a git commit with an agent"
+++

I often sit down to write some code and then, four yaks, two shaves, and a haircut later, I realize my working tree contains several intertwined changes.

This post shows a reliable workflow and shell script that let an agent split up such messy commits for you. The trick is to *subtract* changes instead of rebuilding them.

Let's start with the shell script. Design notes follow.

## How to use it

- Commit your work on a branch. That branch stays untouched, so you can always safely abandon ship.
- Create a new git branch at the commit immediately before the messy work began. This is where the agent will build the clean commits. (The shell script can't guess the base.)
- *This runs in dangerous mode!* Run it in a sandbox if security matters.
- Run the shell script. By default it uses codex. To use claude, set the environment variable `AGENT=claude`.
- Wait.
- Review.

## The code

```sh
#!/usr/bin/env bash

# SPDX-License-Identifier: MIT
# https://commaok.xyz/ai/split-commit/

set -euo pipefail

if ! repo_root=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "error: not inside a git repository" >&2
  exit 1
fi

if [ "$repo_root" != "$(pwd)" ]; then
  echo "error: run this from the git root ($repo_root)" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "error: working tree is not clean" >&2
  exit 1
fi

if [ "$#" -ne 1 ]; then
  echo "usage: $0 <git-ref>" >&2
  exit 1
fi

ref="$1"
agent="${AGENT:-codex}"
if [ -n "${AGENT:-}" ] && [ "$agent" != "codex" ] && [ "$agent" != "claude" ]; then
  echo "error: unknown AGENT '$AGENT' (expected codex or claude)" >&2
  exit 1
fi

prompt=$(cat <<'EOF'
You are splitting up work into a series of well-organized, atomic git commits.

All the as-yet unsplit code changes are currently staged.

Please:

- Analyze the staged changes.
- Identify one cleanly separable commit. (Bear in mind that it is possible that no further separation is appropriate.)
- Revert all other changes. (The other changes are saved elsewhere. Preserving them for future work is not your responsibility.)
- Do minor cleanup as necessary to ensure that the current commit is a clear, coherent, standalone commit with passing tests, bearing in mind the other changes that you know will follow.
- Commit those changes.
EOF
)

while true; do
  git checkout "$ref" -- .
  if git diff --quiet HEAD -- .; then
    echo "no differences remain; all done"
    break
  fi

  # As of Nov 2025, there is no straightforward set of flags we can pass to
  # codex or to claude that enable them to run git commands (like 'git add' and 'git commit')
  # without full-on YOLO mode. I'm not interested in polluting this short, simple
  # script with complicated claude configs that will inevitably be fiddly and wrong and rot quickly,
  # and codex doesn't even have the option. I give up.
  case "$agent" in
    claude)
      claude --print --dangerously-skip-permissions "$prompt"
      ;;
    codex)
      codex exec --sandbox danger-full-access "$prompt"
      ;;
  esac
done
```

## Design

This script mirrors my own (human) workflow.

There are two naive approaches, and neither works very well.

One naive option is to say "here's the end result, rebuild it from scratch". This is slow, error-prone, and tedious: halfway through, you're reasoning about diffs of diffs.

Another naive approach is to unstage everything and then re-stage one hunk at a time, committing as appropriate. This works well as long as the changes are fully orthogonal. But often there will be multiple changes applied to the same line of code, which means merely staging hunks won't work. You end up juggling a pile of temporary paste buffers.

Both these workflows risk drifting from the final code that you originally wrote and tested. And both demand executive function, state management, and long-term planning.

There is a better way: repeatedly subtract everything except one clean change.

Start in a fresh branch. Then:

- pull in the final code you want to end up at
- identify one clean atomic commit within it
- revert everything else!
- do any minor cleanup required to get the code looking good and tests passing
- repeat

This works well because:

- each new commit can be extracted and cleaned up locally
- minor transient cleanups get overwritten each round, producing natural diffs
- the end state is reapplied each time, making drift nearly impossible

Give it a try.

---

Hat tip to [Rog Peppe](https://bsky.app/profile/rog.bsky.social/post/3m5gptuzgj22g) for kicking this off.
