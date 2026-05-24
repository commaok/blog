+++
date = "2026-05-24T05:12:48-07:00"
title = "Copy-on-write git worktrees"
draft = false
+++

In the before times, I typically used a small, curated handful of git worktrees. Now the worktrees grow like bermuda grass, to the extent that they've become a disk space problem.

Git worktrees do share their git objects, but they don't share their working tree. That's the whole point: you can edit them independently.

But conveniently, if you are using a filesystem that supports reflinking (APFS on macOS, some Linux filesystems), you can share most of the working tree as well!

Git doesn't offer this out of the box, although hopefully that'll change someday.

In the meantime, you can approximate it:

- run `git worktree add` with `--no-checkout`
- pick another worktree that probably has similar files
- simulate the checkout by doing CoW/reflink copies of git-tracked files from that worktree
- have git complete the checkout, to fill in missing or mismatched files and to refresh the index

I bundled this all up in a vibe-engineered command at [https://github.com/josharian/git-cow-worktree](https://github.com/josharian/git-cow-worktree). It's a bit slower than using `git worktree` directly when there are lots of files, but otherwise I've been pretty happy with it.
