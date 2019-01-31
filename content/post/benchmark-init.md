+++
date = "2019-01-31T13:53:05-08:00"
title = "Benchmarking package initialization"
draft = false
+++

Go program execution doesn't start at `func main`.
First is [a bit of bootstrapping](https://github.com/golang/go/blob/9473c044f1d492a6ba49ec695042dec4365d70ca/src/runtime/asm_amd64.s#L87).
Then the [runtime gets initialized](https://github.com/golang/go/blob/688667716ede8b133d361db0a1d47eab24ced7f7/src/runtime/proc.go#L518).
Then, package by package, the program initializes global variables and runs `init` functions.
Then it's time for `main`.

Usually, the startup time for a Go program is negligible,
and irrelevant compared to its steady state performance.

For short-lived programs, though, startup performance can matter a lot.
This is particularly true if [the program is a low level tool that is executed repeatedly by other programs](https://golang.org/issue/29382).
There has also been [recent interest in optimizing the startup impact of the standard library](https://golang.org/issue/26775).

---

So: How do you benchmark and profile program initialization?

If you are interested in memory allocation, [Brad Fitzpatrick](https://github.com/bradfitz) has [a simple solution](https://play.golang.org/p/9ervXCWzV_z). This works because [memory profiling is on by default](https://commaok.xyz/post/memprofilerate/).

But what about execution time?

One obvious idea is to copy your global variables and init functions into a regular Go benchmark. This is tedious and (like most tedious things) error-prone. It also fails for a more subtle reason: The compiler generates different (slower) code for variable initialization when it occurs inside a function instead of at the top level. This is because the compiler can make fewer assumptions (although as always [there are ways to improve](https://golang.org/issue/29573#issuecomment-451596366)).

Another idea is to hack your code to return immediately from `main` and then use [`benchcmd`](https://github.com/aclements/go-misc/blob/master/benchcmd/main.go) to benchmark and [`perf`](https://en.wikipedia.org/wiki/Perf_%28Linux%29) to profile. This works on Linux, although it’d be nicer to have an option that uses standard Go tooling. Also, because initialization is generally fast, you need to do a bunch of runs to gather data, and the exec and profiler tool overhead can be considerable. (I tried using macOS’s `instruments` for profiling the `go` tool's startup and found that—in addition to being generally useless—it added *300x* overhead per run!)

---

Instead, let’s [void the warranty](https://golang.org/doc/go1compat)!

Here’s [how the compiler implements package initialization](https://github.com/golang/go/blob/faf187fb8e2ca074711ed254c72ffbaed4383c64/src/cmd/compile/internal/gc/init.go#L58), at least as of Go 1.12. For each package, it generates code like:

```go
var initdone· uint8

func init() {
	if initdone· > 1 {
		return
	}
	if initdone· == 1 {
		throw()
	}
	initdone· = 1
	// for all imported packages {
		pkg.init()
	// }
	init.ializers()
	
	init.<n>() // call user init functions, if any
	initdone· = 2
	return
}

func init.ializers() {                          (0)
	{ <init global variables for this package> }
}
```

This `init` takes the place of any `init` functions in the package; those are renamed `init.0`, `init.1`, and so on.

If we could reset `initdone·` to 0 and then call this `init` function, then we’d be (re-)executing the exact code that gets executed during package initialization.

We can do that! We'll use [`//go:linkname`](https://github.com/golang/go/blob/5efe9a8f11c81116f102f56c49a9415fd992c038/src/cmd/compile/doc.go#L168) to get access.

Here's an example, benchmarking `net/http` package initialization:

```go
package p_test

import (
	_ "net/http" // must import net/http, so that net/http.init actually ends up in the executable
	"testing"
	_ "unsafe" // must import unsafe to use go:linkname
)

//go:linkname _initdone net/http.initdone·
var _initdone uint8

//go:linkname _init net/http.init
func _init()

func BenchmarkNetHTTPInit(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_initdone = 0
		_init()
	}
}
```

And voila! A regular old Go benchmark that does just what we want.

---

Mostly. There are a few gotchas, above and beyond merely being a terrible idea.

First, if you do non-idempotent work in one of your `init` functions, things could get wonky. We did just void the warranty, after all. And I don’t know what might happen if you re-initialize package runtime or testing or something else low level while running a benchmark. Almost certainly something bad.

Second, as written, this only measures the initialization of `net/http` and *not any of its dependencies*. This might or might not be want you want. You can work around this by using more `//go:linkname` to reset `initdone·` to 0 for all dependencies. Then, as you can see from the compiler pseudocode, a single call to `_init` will re-initialize those packages as well.

Third, using `//go:linkname` requires that the symbol we are linkname-ing to must actually be in the executable. The easiest way to do this is to import the package in question. If you are working with an internal package, that means you might need to put this code somewhere with sufficient visibility for that import to work.

Fourth, line number support for autogenerated code isn't all that fabulous. If you encounter frustrating pprof output while doing this, consider [filing bugs](https://golang.org/issue/new).

---

Now that you can benchmark, what do you do if you find a bottleneck you want to fix? Mostly, lazily initialize things instead, usually using [`sync.Once`](https://golang.org/pkg/sync/#Once), which is fast and hopefully [will be faster still in Go 1.13](https://golang.org/cl/152697).

---

Thanks to [Daniel Martí](https://github.com/mvdan) for posing this question and for reading an early draft of this blog post.

Daniel has also created a tool based on this blog post, [benchinit](https://github.com/mvdan/benchinit), so that you can [break your programs](https://github.com/golang/go/issues/19348#issuecomment-309446070) this way with even less effort.
