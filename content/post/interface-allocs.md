+++
title = "Logging, interfaces, and allocation"
date = "2017-02-06T10:52:40-08:00"
draft = false
+++

This post is about some new compiler optimizations scheduled for Go 1.9,
but I want to start with logging.

---

A couple of weeks ago, Peter Bourgon started a
[thread on golang-dev about standardizing logging](https://groups.google.com/forum/#!topic/golang-dev/F3l9Iz1JX4g).
Logging is pervasive, so performance came up quickly.
The [go-kit log package](https://github.com/go-kit/kit/tree/master/log) uses structured logging,
centered on this interface:

```go
type Logger interface {
    Log(keyvals ...interface{}) error
}
```

Sample call:

```go
logger.Log("transport", "HTTP", "addr", addr, "msg", "listening")
```

Note that everything that goes into a logging call gets converted into an interface.
This means that it allocates a lot.

Compare with another structured logger, [zap](https://github.com/uber-go/zap).
Zap has uglier call sites, specifically to avoid using interfaces, in order to be zero-allocation:

```go
logger.Info("Failed to fetch URL.",
  zap.String("url", url),
  zap.Int("attempt", tryNum),
  zap.Duration("backoff", sleepFor),
)
```

The arguments to `logger.Info` have type `logger.Field`.
`logger.Field` is a kind of union-ish struct
that includes a type and a field each for a `string`, an `int`, and an `interface{}`.
Thus interfaces are not necessary to pass the most common kinds of values.

---

Enough about logging. Why does converting a concrete value to an interface sometime allocate?

Interfaces are represented as two words, a type pointer and a value pointer.
Russ Cox wrote a [lovely explanation of this](https://research.swtch.com/interfaces),
which I will not attempt to repeat. Just go read it.

His post is slightly out of date, however.
He points out an obvious optimization: When the value is pointer-sized or smaller,
we can just put the value directly into the second interface word.
However, with the advent of concurrent garbage collection,
[that optimization got eliminated](https://golang.org/issue/8405).
Now the second word in the interface is always a pointer.

Consider:

```go
fmt.Println(1)
```

Before Go 1.4, this code did not allocate,
because the value `1` could be put directly into the second interface word.

That is, the compiler treated it something like this:

```go
fmt.Println({int, 1})
```

where `{typ, val}` represents the two words in an interface.

As of Go 1.4, this code started allocating, because `1` is not a pointer,
and the second word must contain a pointer.
So instead the compiler+runtime conspired to turn it into something roughly like:

```go
i := new(int) // allocates!
*i = 1
fmt.Println({int, i})
```

This was painful, and there was much wringing of hands and gnashing of teeth.

The [first significant optimization to remove allocations](https://github.com/golang/go/commit/22701339817a591cd352ecd43b0439b84dbe8095)
was added a bit later. It kicked in when the resulting interface did not escape.
In that case, the temporary value could be put on the stack instead of the heap.
Using our example code above:

```go
i := new(int) // now doesn't allocate, as long as e doesn't escape
*i = 1
var e interface{} = {int, i}
// do things with e that don't make it escape
```

Unfortunately, many interfaces do escape, including those used in calls
to `fmt.Println` and in our logging examples above.

Happily, Go 1.9 will bring a few more optimizations,
in part inspired by the logging conversation.
(Unless those optimizations get reverted in the next six months,
which is always a possibility.)

The first optimization is [to not allocate to convert a constant to an interface](https://golang.org/issue/18704).
So `fmt.Println(1)` will no longer allocate. The compiler puts
the value `1` in a readonly global, roughly like this:

```go
var i int = 1 // at the top level, marked as readonly

fmt.Println({int, &i})
```

This is possible because constants are immutable,
and will thus be the same every time the interface conversion is reached,
including recursively and concurrently.

This was inspired directly by the logging discussion.
In structured logging, many of the arguments are constants--
almost certainly all the keys, and probably a few of the values.
Recall the go-kit example:

```go
logger.Log("transport", "HTTP", "addr", addr, "msg", "listening")
```

This code drops from 6 allocations to 1, because five of the arguments are constant strings.

The second new optimization is [to not allocate to convert bools and bytes to interfaces](https://golang.org/issue/17725).
This optimization works by adding a global `[256]byte` array called `staticbytes` to every binary,
where `staticbytes[b] = b` for all b.
When the compiler wants to put a bool or uint8 or other single-byte value
into an interface, instead of allocating, it calculates a pointer into this array.
That is:

```go
var staticbytes [256]byte = {0, 1, 2, 3, 4, 5, ...}

i := uint8(1)
fmt.Println({int, &staticbytes[i]})
```

There is a third new optimization proposed that is still under review,
which is [to not allocate to convert common zero values in an interface](https://golang.org/cl/36476).
It applies to integers, floats, strings, and slices.
This optimization works by checking at runtime whether the value is `0` (or `""` or `nil`).
If so, it uses a pointer to [an existing large chunk of zeroed memory](https://github.com/golang/go/blob/go1.8rc3/src/runtime/hashmap.go#L1182)
rather than allocating some memory and zeroing it.

---

If all goes well, Go 1.9 should eliminate a fair number of allocations during interface conversions.
But it won't eliminate all of them, which leaves performance still on the table as the logging discussion continues.

The interplay between implementation decisions and APIs is interesting.

Picking an API requires thinking about the performance consequences.
It is not an accident that `io.Reader` requires/allows callers to bring their own buffer.

Performance is in no small part a consequence of the implementation decisions.
We have seen in this post that the implementation details of interfaces can substantially alter
what code allocates.

And yet those very implementation decisions depend on what kind of code people write.
The compiler and runtime authors want to optimize real, common code.
For example, the [decision to in Go 1.4 to keep interface values at two words instead of changing them to three](https://golang.org/issue/8405),
which made `fmt.Println(1)` allocate, was based on looking at the kind of code people wrote.

Since the kind of code people write is often shaped heavily by the APIs they use,
we have the kind of organic feedback loop that is fascinating and sometimes challenging to manage.

Not a terribly deep observation, perhaps, but there is one takeaway:
If you're designing an API and worrying about performance,
keep in mind not just what the existing compiler and runtime actually do,
but what they could do.
Write code for the present, but design APIs for the future.

And if you're not sure, ask. It worked (a bit) for logging.
