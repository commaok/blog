+++
date = "2019-12-17T08:12:48-07:00"
title = "Interning strings in Go"
draft = false
+++

This blog post covers string interning in Go.

# What is a string?

In Go, a string is [a (possibly empty) immutable sequence of bytes](https://golang.org/ref/spec#String_types). The critical word here for our purposes is *immutable*. Because byte slices are mutable, converting between `string` and `[]byte` generally requires an alloc and copy, which is expensive.

Under the hood, strings in Go are (currently) represented [as a length and a pointer to the string data](https://research.swtch.com/godata).

# What is string interning?

Consider this code:

```go
b := []byte("hello")
s := string(b)
t := string(b)
```

`s` and `t` are strings, so they both have a length and a data pointer. Their lengths are obviously the same. What about their data pointers?

The Go language doesn't provide us a direct way to find out. But we can sniff around with unsafe:

```go
func pointer(s string) uintptr {
    p := unsafe.Pointer(&s)
    h := *(*reflect.StringHeader)(p)
    return h.Data
}
```

(This function ought to return an `unsafe.Pointer`. See [Go issue 19367](https://golang.org/issue/19367).)

If we `fmt.Println(pointer(s), pointer(t))`, we get something like `4302664 4302632`. The pointers are different; there are two separate copies of the data `hello`.

(Here's a [playground link](https://play.golang.org/p/oyq6Pz79EGa) if you want to experiment. What happens if you change `"hello"` to just `"h"`? [Explanation.](https://golang.org/cl/97717))

Suppose you wanted instead to re-use a single copy of the data `hello`? That's [string interning](https://en.wikipedia.org/wiki/String_interning). There are two advantages to interned strings. The obvious one is that you don't need to allocate and copy the data. The other is that it speeds up string equality checks. If two strings have the same length and same data pointer, they are equal; there is no need to actually examine the bytes.

As of Go 1.14, Go doesn't intern most strings. Interning, like any form of caching, also has costs: synchronization for concurrency safety, garbage collector complexity, and extra code to execute every time a string is created. And, like caching, there are cases in which it is harmful rather than helpful. If you were processing a list of dictionary words, no word would ever occur twice, so interning strings would be waste both time and memory.

# Manual string interning

It is possible to manually intern strings in Go. What we need is a way to look for an existing string to re-use given a byte slice, perhaps using something like a `map[[]byte]string`. If a lookup succeeds, we use the existing string; if it fails, we convert and then store that string for future use.

There's only one problem: You can't use `[]byte` as a map key.

Thanks to a [long-standing compiler optimization](https://golang.org/cl/83740044), we can use a `map[string]string` instead. The optimization is that map operations whose key is a converted byte slice don't actually generate a new string  to use during the lookup.

```go
m := make(map[string]string)
b := []byte("hello")
s := string(b) // allocates
_ = m[string(b)] // doesn't allocate!
```

(A similar optimization applies in other scenarios in which the compiler can prove that a converted byte slice doesn't get modified during use, such as [`switch string(b)` when all switch cases are free of side-effects](https://github.com/golang/go/blob/056a3d1c6f6f92b095f88b01d004eb2656a688c5/src/cmd/compile/internal/gc/swt.go#L249).) 

The entirety of the code required to intern strings is this:

```go
func intern(m map[string]string, b []byte) string {
    // look for an existing string to re-use
    c, ok := m[string(b)]
    if ok {
        // found an existing string
        return c
    }
    // didn't find one, so make one and store it
    s := string(b)
    m[s] = s
    return s
}
```

Pretty simple.

# Complications

Note that this manual interning routine pushes the problems with interning into the calling code. You need to manage concurrent access to the map; you need to decide the lifetime of the map (and thus everything in it); and you need to pay the extra cost of a map lookup every time you need a string.

Pushing these decisions onto the calling code can yield better performance. For example, suppose you were [decoding json into a `map[string]interface{}`](https://golang.org/issue/32779). The json decoder is probably not concurrent. The lifetime of the map can be tied to the json decoder. And the keys of this map are likely to be repeated frequently, which is the best case scenario for string interning; it makes the extra cost of the map lookup worth it.

# A helper package

If you don't want to have to think about any of these complications, and are willing to accept the slight concomitant loss of performance, and have code in which string interning may help, there's a package for that: [github.com/josharian/intern](https://github.com/josharian/intern).

It works by horribly abusing `sync.Pool`. It stores interning maps in a `sync.Pool`, retrieving them as needed. This neatly solves the concurrent access problem, because `sync.Pool` access is concurrency-safe. It mostly solves the lifetime problem, because the contents in a `sync.Pool` are usually [eventually](https://golang.org/issue/22950) garbaged collected. (For related reading about managing lifetimes, see [Go issue 29696](https://golang.org/issue/29696).)

# More reading

There's lots more discussion and links about string interning in Go in [issue 5160](https://golang.org/issue/5160).

