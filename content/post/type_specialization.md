+++
date = "2023-04-03T08:12:48-07:00"
title = "Type Specialization in Go"
draft = false
+++

*This post was originally tweets but then things happened, and it needed a new linkable home. Btw, I'm now @commaok@inuh.net on Mastodon.*

This post is about manual type specialization, which can make a big difference in some hot code.

Consider this:

```go

type Gopher interface {
  Goph()
}

func f(x Gopher) {
  // ...
  if t, ok := x.(*T); ok {
    t.Goph()
  } else {
    x.Goph()
  }
  // ...
}
```

It's weird. The type assertion to `(*T)` is semantically irrelevant. We call `.Goph` on each branch!

But that pointless type assertion is also really cheap. And on the success branch, the compiler can do improved escape analysis (alloc less) and inline the method body (faster).

This is one form of type specialization, a common optimization done by JIT compilers.

This technique can help if you have (1) very hot code that (2) is called via an interface but (3) has only one or two primary implementations.

It hurts readability. Use only when it counts, and document it.

Why doesn’t the compiler do this for you? It doesn’t know what types would be good to try. [JIT](https://en.wikipedia.org/wiki/Just-in-time_compilation) would help. [IPO/WHO/LTO](https://en.wikipedia.org/wiki/Interprocedural_optimization) might help.

And PGO probably will help, in some future Go release! As of [Go 1.20](https://tip.golang.org/doc/go1.20#compiler), cmd/compile has some [profile-guided optimization](https://github.com/golang/go/issues/28262) around inlining. More is planned, including register allocation and type specialization, which might end up covering this use case.
