+++
date = "2026-01-06T07:12:48-07:00"
title = "Vibe-coded Go static analysis tools"
+++

Ideas are now a major bottleneck for vibe-coding. There are whole categories of software that simply don't occur to me to write.

[Philip Zeyliger](https://philz.dev) pointed me at one: Go static analysis tools.

These are great candidates:

- easy to describe
- easy to test
- high value
- low risk

He created a checker that requires `slog.InfoContext` instead of `slog.Info` when a context is available, to improve our telemetry/observability.

I followed up with a checker that lets you annotate a Go struct as requiring complete, explicit annotation.

I wanted to convert some long function signatures to use structs, but I worried about losing type safety. Change `func Foo(s string)` to `func Foo(s string, i int)` and the compiler will make you update every call site. But with `func Foo(x FooArgs)`, if you add an `i int` field to `FooArgs`, existing call sites will silently use the zero value. Configuration-y structs have the same problem.

Now in our codebase at [exe.dev](https://exe.dev), if you write:

```go
//exe:completeinit
type T struct {
    A, B int
}
```

then it will accept `T{A: 0, B:1}`, but reject `T{B:1}`, `T{0, 1}`, and `T{}`. (Other forms of initialization are possible, but unlikely for the kinds of places we use such structs. So we can ignore them!)

In case you're curious, here is the entirety of the text that I typed to get my analysis tool up and running:

> we have one custom go analyzer (slogcontext). i want to add another. i want to be able to annotate structs as requiring complete initialization, i.e., any time it appears in a struct literal every single field must be syntactically present (complete with keys). the use case is preventing accidents in which we add an important field to (say) a config struct param but forget to update a use because the code still compiles. write the analyzer (complete with tests), and hook it up to CI. and then--and only then--look for promising candidates that out to be annotated, and annotate them. remmber that this annotation will be annoying, so we only want ot do it for the sorts of cases that will be error-prone.

> let's rename the annotation to //exe:completeinit (with no space). please annotate preCreateBoxOptions and run the analyzers. this is the kind of config struct i have in mind. surely there are others.

> great. now that we have it, please extract execore.NewServer's args into a config struct, appropriately annotated.

It has been chugging along merrily for weeks, catching the (rare) mistake.

Now you have this idea too.
