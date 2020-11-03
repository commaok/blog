+++
date = "2020-11-02T09:12:48-07:00"
title = "git rebase --fork-point considered harmful (by me)"
draft = false
+++

This is the first blog post I've written that isn't about Go, and it's pretty weedy. Feel free to stop reading now.

This is a git [experience report](https://github.com/golang/go/wiki/ExperienceReports) based on something that bit me hard today, despite being quite experienced with git. Play along!

# Prologue

Initialize a repo. Create two commits.

```
$ git init .
Initialized empty Git repository in <redacted>

$ touch readme
$ git add readme
$ git commit -a -m "initial commit"
[main (root-commit) ac2d8e7] initial commit
 1 file changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 readme

$ touch readme.2
$ git add readme.2
$ git commit -a -m "another commit"
[main fb0f7fe] another commit
 1 file changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 readme.2
```

So far, pretty mundane. Here's what the repo looks like:

```
$ git log --all --decorate --oneline --graph
* fb0f7fe (HEAD -> main) another commit
* ac2d8e7 initial commit
```

# Oops

I meant to create `readme.2` on a branch. No problem. Let's create that branch now.

```
$ git checkout -b branch
Branch 'branch' set up to track local branch 'main' by rebasing.
Switched to a new branch 'branch'
```

Oh, and better put `main` back where it belongs.

```
$ git checkout main
Switched to branch 'main'
$ git reset --hard HEAD~1
HEAD is now at ac2d8e7 initial commit
```

Now the repo looks like this:

```
$ git log --all --decorate --oneline --graph
* 95cc2c0 (branch) another commit
* 20a231b (HEAD -> main) initial commit
```

# Bug fix

Let's fix a bug on main.

```
$ echo "nothing to see here" > readme
$ git commit -a -m "fill out the readme"
[main eebece5] fill out the readme
 1 file changed, 1 insertion(+)
```

Now `main` and `branch` have diverged a bit.

```
$ git log --all --decorate --oneline --graph
* eebece5 (HEAD -> main) fill out the readme
| * fb0f7fe (branch) another commit
|/  
* ac2d8e7 initial commit
```

# Time to rebase

Let's get `branch` rebased onto `main`.

```
$ git checkout branch
Switched to branch 'branch'
Your branch and 'main' have diverged,
and have 1 and 1 different commits each, respectively.
  (use "git pull" to merge the remote branch into yours)
```

Before reading any further, stop. Summon your git fu. What will happen when we run `git rebase`?

If you're like me, you expect something like this:

```
* 7a8805e (HEAD -> branch) another commit
* eebece5 (main) fill out the readme
* ac2d8e7 initial commit
```

Three commits. `branch` has been rebased on top of `main`, so it is one commit ahead of it.

OK, let's find out what really happens.

```
$ git rebase
Successfully rebased and updated refs/heads/branch.
```

Moment of truth.

```
$ git log --all --decorate --oneline --graph
* eebece5 (HEAD -> branch, main) fill out the readme
* ac2d8e7 initial commit
```

There are only two commits. `branch` and `main` are on the same commit.

What happened to the third commit? It's gone.

# Denouement

What happened was `--fork-point`.

The first step to a rebase (and many other operations) is to find a [merge base](https://git-scm.com/docs/git-merge-base). This is some shared commit in history, common ground from which to trace divergent paths.

The most obvious way to find a merge base is by looking at the graph for the most recent commit reachable by everyone.

But inspecting the graph doesn't always get you the ideal result. What if you intentionally abandoned some commits on `main`? Looking just at the graph to find the merge base might accidentally resuscitate them. There's a [fully worked example](https://git-scm.com/docs/git-merge-base#_discussion_on_fork_point_mode) in the git docs.

The `--fork-point` flag is a clever attempt to work around this. `git rebase` describes it thus:

> Use reflog to find a better common ancestor between `upstream` and `branch` when calculating which commits have been introduced by `branch`.

The [git reflog](https://git-scm.com/docs/git-reflog) is a log of changes made to git refs. (If you don't know what a "ref" is, substitute the word "branch".) It's meta version control. It tracks what you did with your version control over time.

The reflog is quite useful if you make a horrible mistake. You can poke through the reflog to find a lost commit.

`--fork-point` looks through the *temporal history of your git repo* to pick a merge base, "allowing you to replay only the commits on your topic, excluding the commits the other side later discarded." In this context, "later" really means later in time, not "descendent of" in abstract git graph world.

And here we have the explanation for what happened. I discovered I had committed on `main` by accident, and *reset `main` to the previous commit*. From `--fork-point`'s perspective, the `main` branch had *discarded* the commit on `branch`. Therefore it was not included when we selected a merge base to rebase `branch` onto `main`.

# What's wrong here?

To my mind, two things went wrong here.

`--fork-point` assumes that discarded commits were discarded *because they were unwanted*. But that is not always true. In my case, they were discarded because they were unwanted *at that moment*. Adding more clever heuristics might help some here, but I suspect it's impossible to infer intent, which is what is required.

The bigger issue is that the behavior of `git rebase` now depends on (almost) invisible, inscrutable state. The ability to mentally model what a command will do is critical to being able to use any tool. It's pretty easy to view a git graph; it is the default view for most git UIs. And it's not too hard as a human to pick out the topological merge base from there. The reflog is all but invisible. And it is definitely not easy for a human to process.

# The fix

The solution is obviously more flags. My git config's `[alias]` section now includes `r = rebase --no-fork-point`.
