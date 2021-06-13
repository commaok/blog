+++
date = "2021-06-13T08:12:48-07:00"
title = "How to test a Go beta or RC"
draft = false
+++

Around this time in the [Go release cycle](https://github.com/golang/go/wiki/Go-Release-Cycle),
the Go team [asks people to test Go betas and release candidates](https://groups.google.com/forum/#!forum/golang-announce).

Please help! It is easy, fast, and important.

This post is about how, what, and why to test.

# Installation

Pre-releases can be downloaded using `go get`. For example:

```
$ go install golang.org/dl/go1.17beta1@latest
$ go1.17beta1 download
$ go1.17beta1 test your/favorite/package
```

A complete list of pre-releases is available at https://pkg.go.dev/golang.org/dl.

# Betas

Betas are early looks at a new release. They sometimes have known bugs. Critical bugs are uncommon but not unheard of. New APIs may still change in response to feedback. You should not use a beta release in production.

Here's what you should do with a Go beta release, ordered from **easy and fast** to **pretty involved**. Even if you only do the first item or two, it is helpful!

1. Run your tests locally. Investigate and [report](https://golang.org/issue/new) any new failures.
1. Read [the draft release notes](https://tip.golang.org/doc/go1.17). (You may have to edit this link appropriately for newer releases.) If you see anything concerning, [file an issue to discuss](https://golang.org/issue/new).
1. Run your benchmarks locally. Investigate and [report](https://golang.org/issue/new) performance regressions.
1. If you have a staging server, CI, or anywhere you can run more involved tests, use the pre-release version there, and [file any issues you encounter](https://golang.org/issue/new).
1. Look over [the API diffs](https://github.com/golang/go/blob/master/api/go1.17.txt). (Again, adjust link as appropriate.) If you see anything concerning, [file an issue to discuss](https://golang.org/issue/new).



# Release candidiates

Release candidates are generally free of known serious bugs. (Google tests release candidates on their live servers.) APIs should be stable.

The list of things to do with a Go RC is the same as with betas, except that, if you have the bandwidth and means, you may want to try running it in production, on a small subset of servers.


# I don't have that much time

It is not atypical to have one or two betas and one or two RCs. That's a lot of testing. What if you only have a small amount of time to contribute to helping Go have bug-free releases?

If you can only do one thing, **run your tests locally using the first beta**. It takes just a few minutes. The earlier bugs get caught, the more likely it is they can be fixed, and fixed well.

If you can do a little bit more, please **read the release notes early**. You'd probably read them when the release came out anyway. By reading it early, there's still a chance of fixing any problems you see.


# Why test betas and RCs?

Programming languages, and their tooling and communities, are complex creatures. People use them in marvelous and unusual ways. And programming languages are software too, and you know what that means. Despite the Go contributors' best efforts, the Go issue tracker has its fair share of frustrated programmers who have discovered too late that a new release doesn't work for them: a subtle behavior change, a rare performance regression, an API design that is not quite right.

Once a release is out, fixing these problems becomes harder and sometimes even impossible. Security problems get prompt fixes, but anything short of that, even a critical bug, won't see a fix for a month, at the next point release. Non-critical bugs won't be fixed until the next full Go release, six months out, at the earliest. And in many cases, thanks to the [Go 1 Compatibility Promise](https://golang.org/doc/go1compat), we may simply be stuck forever with whatever the problem is.

Betas and RCs are our only chance as a community to catch many issues while there's still time to really fix them.


# Bonus

Consider adding the "tip" version of Go to your CI. This is especially helpful in catching problems very early, but it does add a fair bit of work: Before filing issues, you need to check [the build dashboard](https://build.golang.org/) and investigate a bit to determine whether any failure is worth reporting.
