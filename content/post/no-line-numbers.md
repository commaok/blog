+++
date = "2020-04-30T08:12:48-07:00"
title = "Life without line numbers"
draft = false
+++

If you are desperate for 6% smaller Go binaries, this blog post is for you. (I did this experiment to help out [Tailscale](https://www.tailscale.com/). Disclosure: I'm an investor.) If binary size doesn't worry you, well, maybe you'll find it entertaining.

In order to get example numbers for this post, I grabbed a random item from my GOPATH. All the hard numbers in this blog post are for `github.com/mvdan/sh/cmd/shfmt`. From a bit of experimenting, they seem fairly representative.

I am using [commit 9d812cfa5c](https://github.com/golang/go/commit/9d812cfa5c) of the Go toolchain as my base commit. This is the `master` branch as of April 29, 2020; it will probably be similar to the Go 1.15beta1 release. I'm using it rather than Go 1.14 because it contains several binary size reductions, including [one in particular](https://go-review.googlesource.com/c/go/+/230544) that you'll definitely want if you're concerned about binary sizes.

---

There are lots of ways to shrink a binary. Removing extraneous dependencies is probably the best way. [Avoiding global maps through judicious use of sync.Once](https://go-review.googlesource.com/c/go/+/210284) can help. [Keeping separable code separate by indirection](https://go-review.googlesource.com/c/go/+/228111) can help. You can [suppress equality algorithm generation](https://twitter.com/bradfitz/status/1255704982893912064) (ick...until you really need it). You can usually save double-digit percentages by stripping debugging information: pass [`-ldflags=-w` to `go build`](https://github.com/golang/go/issues/38777).

Let's assume you've done all that. And you still need to shrink more. And that need is so pressing you're willing to make some sacrifices for it.

Go binaries contain a lot more than just executable code. There are type descriptors that describe the types in a Go program. There are garbage collection data structures. There's debugger information. And there are mappings from PCs to position information. (And there's lots more, too.)

We're going to get rid of the position information.

---

We can't just strip out the position information entirely from the binary. That would break lots of stuff.

But we can make all the line numbers the same. That shouldn't break anything. After all, no one (except gofmt) said we had to put our code on multiple lines.

For example, instead of [this](https://play.golang.org/):

```go
package main

import (
	"fmt"
)

func main() {
	fmt.Println("Hello, playground")
}
```

We could write [this](https://play.golang.org/p/skI5nMleZgt):

```go
package main

import ( "fmt" ); func main() { fmt.Println("Hello, playground") }
```

The Go compiler and runtime has to be prepared for lots of stuff to be on one line.

We could write a preprocessor, maybe using [`-toolexec`](https://golang.org/cmd/go/#hdr-Compile_packages_and_dependencies) and [`//line` directives](https://golang.org/cmd/compile/#hdr-Compiler_Directives), but it's easier to just hack the compiler. Fortunately, this is well-factored code, so we only need to touch two little spots.

```diff
--- a/src/cmd/compile/internal/syntax/pos.go
+++ b/src/cmd/compile/internal/syntax/pos.go
@@ -23,3 +23,3 @@ type Pos struct {
 // MakePos returns a new Pos for the given PosBase, line and column.
-func MakePos(base *PosBase, line, col uint) Pos { return Pos{base, sat32(line), sat32(col)} }
+func MakePos(base *PosBase, line, col uint) Pos { return Pos{base, 1, 1} }
 
@@ -101,2 +101,3 @@ type PosBase struct {
 func NewFileBase(filename string) *PosBase {
+       filename = "x.go"
        base := &PosBase{MakePos(nil, linebase, colbase), filename, linebase, colbase}
```

Every file is now named `x.go`, and every source position has line 1 and column 1. (Columns don't actually matter for binary size, once you've stripped DWARF.)

This isn't quite enough. There are two other spots in the toolchain that get unhappy if all code lives at `x.go:1:1`.

The first is in [constructing DWARF](https://github.com/golang/go/issues/38698), for debuggers. We can just remove that check: We are already stripping DWARF, so generating invalid DWARF doesn't matter.

The second is in cgo. There are some security checks about where certain cgo pragma can be located. We're going to trust ourselves not to violate them (by ensuring all code keeps building with an unaltered toolchain), and remove that security check.

The full diff is at https://github.com/josharian/go/commit/1a3e66ceed.

---

Now all code we compile has `x.go:1:1` as its position.

Our program, compiled with `-ldflags=-w`, shrinks from 3,126,800 bytes to 2,938,384 bytes, or about 6%.

Most of this is from shrinking the encoding of position information. A little bit of it comes from a compiler optimization.

These two programs compile slightly differently:

```go
func f(x []byte) {
    _ = x[0]
    _ = x[1]
}
```

```go
func f(x []byte) {
    _, _ = x[0], x[1]
}
```

If you run `go tool compile -S x.go` on each of these files, you'll see that [the first program](https://godbolt.org/z/UFf2JL) contains two separate calls to `runtime.panicIndex`. [The second program](https://godbolt.org/z/26rRog) contains only one such call. The reason is that `runtime.panicIndex` must display a backtrace containing the line number of the line that panicked. In the first program, we need two separate panics, one for each possible panicking line number. In the second program, we don't, so the compiler combines them.

Since we are now putting all code on the same line, the compiler can combine more panics than before.

---

What do we lose by doing this? Anything that needs accurate position information. Panic backtraces will still show you the PC, the function, the arguments, and so on. But all line numbers will be `x.go:1`. With patience, you could still figure out the line number yourself based on the PC, but it'd take some manual work. Pprof will still be able to analyze performance by function and by instruction, but it'll think everything happens on the same line, which will make analysis by line number useless.

---

Let's play around a bit. What if we ditch only filenames, and keep the true line numbers? It saves only 0.9%. And as you'd then expect, keeping only accurate filenames and making all line number 1 saves 5.1%.

So most of the savings are from the line numbers. What if we keep the original filenames, and truncate all line numbers to the nearest multiple of 16? That is, trim our diff down to:

```diff
--- a/src/cmd/compile/internal/syntax/pos.go
+++ b/src/cmd/compile/internal/syntax/pos.go
@@ -23,3 +23,3 @@ type Pos struct {
 // MakePos returns a new Pos for the given PosBase, line and column.
-func MakePos(base *PosBase, line, col uint) Pos { return Pos{base, 1, 1} }
+func MakePos(base *PosBase, line, col uint) Pos { return Pos{base, sat32(line/16*16 + 1), 1} }
 ```

This cuts our binaries by 2.2%. Not bad. What if we divide all line numbers by 16 instead? That preserves exactly the same information as truncating, but we have to multiply by hand to get the "nearby" line number.

```diff
--- a/src/cmd/compile/internal/syntax/pos.go
+++ b/src/cmd/compile/internal/syntax/pos.go
@@ -23,3 +23,3 @@ type Pos struct {
 // MakePos returns a new Pos for the given PosBase, line and column.
-func MakePos(base *PosBase, line, col uint) Pos { return Pos{base, 1, 1} }
+func MakePos(base *PosBase, line, col uint) Pos { return Pos{base, sat32(line/16 + 1), 1} }
 ```

This cuts our binaries by 2.75%! Why does `/16` save 0.5% more than `/16*16`?

Line numbers are stored in the binary using a [varint encoding](https://golang.org/pkg/encoding/binary/#PutVarint) relative to the previous line number. Smaller numbers mean smaller deltas, and can thus be stored more efficiently.
