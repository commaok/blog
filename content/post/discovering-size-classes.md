+++
date = "2020-09-01T09:12:48-07:00"
title = "Discovering alloc size classes in Go"
draft = false
+++

As of Go 1.15, the Go runtime's [memory allocator](https://github.com/golang/go/blob/12c01f7/src/runtime/malloc.go) doesn't always allocate exactly the number of bytes required for an object. Instead, it rounds up to the nearest *size class*.

```go
type T struct {
    i int64
    b byte
}
```

Type `T` has a size of 9 bytes, but allocating a `T` will use 16 bytes.

If you're trying to [reduce the memory usage of a program that allocates a lot of one particular type of object](https://go-review.googlesource.com/c/go/+/41797/), it's good to be aware of the size classes, as the impact of shrinking the object will be a step function.

# What are the size classes?

The easiest way to find out the size classes is to [read the source](https://github.com/golang/go/blob/12c01f7698cd257b7d2e4795b0f8a971ec8533b6/src/runtime/sizeclasses.go).

It's also possible to discover them at run time!

The trick is to use `append`. `append` gets to choose the capacity of the returned slice. And, as you would hope, `append` is [aware of the allocator](https://github.com/golang/go/blob/12c01f7698cd257b7d2e4795b0f8a971ec8533b6/src/runtime/slice.go#L201); it picks a cap that fills as much as possible of the size class it selected.

We are going to start with a nil slice, cap 0. We will then append `n` bytes to it. `append` will helpfully round `n` up to the nearest size class as the new cap.

```go
func sizeup(n int) int {
	b := append([]byte(nil), make([]byte, n)...)
	return cap(b)
}
```

If you [run this in a loop](https://play.golang.org/p/hAfgbpwa45t), you get a nice size class list. In the unlikely event that you were going to do this in a real program, you'd probably calculate the size classes at startup and cache them.

This technique relies on an implementation detail, but hey, the mere existence of size classes is also an implementation detail.

# Who cares?

In particularly performance sensitive code, it sometimes makes sense to overallocate a slice, to avoid allocation in subsequent appends, such as in [math/big](https://github.com/golang/go/blob/master/src/math/big/nat.go#L68). When deciding how much to overallocate, you might want to be size-class aware, so as not to waste capacity that is effectively free. See [#24204](https://github.com/golang/go/issues/24204) for interesting related discussion.

And there's an interesting generics connection. People are fond of pointing out that generics would obviate the need for `append`. You could implement it yourself. But if you want your custom `append` to be as optimized as the runtime's, you need to be aware of the size classes.

# Why not hard-code the size classes?

They change.

Hard-coding the size classes, per-release, behind build tags, is a fine idea. But they're also pretty easy to calculate.

