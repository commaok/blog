+++
date = "2017-01-28T18:06:36-08:00"
title = "Picking up pennies: Disabling memory profiling"
draft = false
+++

If you work on a short-lived, allocation heavy program
and care about a tiny (maybe 0.5%) performance improvement,
this post is for you.

I was looking at a CPU profile of the [Go compiler](https://golang.org/cmd/compile/)
when I noticed something odd: An entry in [`mprof.go`](https://github.com/golang/go/blob/go1.8rc3/src/runtime/mprof.go).
`mprof.go` contains the memory profiling implementation, but I was doing cpu profiling.
Was there a bug in [compilebench](https://godoc.org/rsc.io/compilebench), perhaps?

Nope. The variable [`runtime.MemProfileRate`](https://golang.org/pkg/runtime/#pkg-variables)
controls the rate at which the runtime samples allocations.
And its default value is not 0 (disabled), but `512 * 1024`.

This is a good default.
One sample per 500k of allocations is not much overhead.
And when something goes wrong on a server, you want to be able to find out why,
rather than fussing with profiling settings and then hoping it happens again.

But if you work on a short-lived program, like a compiler,
when something goes wrong, you probably don't have any mechanism for gathering ad hoc profiles.
For any given run, you either have profiling enabled or you don't,
and if something goes wrong, you just enable profiling and try again.

And if your program is allocation-heavy, like the Go compiler,
there might be enough memory profiling samples collected to absorb some CPU time.
(As currently implemented, the first sample is particularly expensive,
as it allocates a pretty large data structure.)

And I'm always looking for performance wins in the compiler, even little ones (hoping they add up).
So I sent a CL to [disable memory profiling entirely when not explicitly requested](https://go-review.googlesource.com/c/35916/).
The benefits aren't head-turning, but it's a very cheap, low risk 0.5% to put in the bank.
It'll get reviewed for Go 1.9.

Doing this in your own program requires nothing more than setting
`runtime.MemProfileRate = 0` when memory profiling has not been requested.
But please, think twice first.
