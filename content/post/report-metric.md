+++
title = "testing.B.ReportMetric"
date = "2019-07-03T18:07:05-08:00"
draft = false
+++

My favorite new API in Go 1.13 is [`testing.B.ReportMetric`](https://tip.golang.org/pkg/testing/#B.ReportMetric). It allows you to report custom metrics from within your benchmarks.

When the API was [proposed](https://github.com/golang/go/issues/26037), the motivating example was `package sort`. The `package sort` benchmarks, like all benchmarks, measure elapsed wall time and (optionally) allocations. But wall time measurements can be noisy, and the sort routines don't allocate much. There is another really useful algorithm-level metric for a sorting routine: How many comparisons does it perform?

Let's use our new to API find out. Here's a simple sort benchmark.

```go
package demo

import (
	"sort"
	"testing"
)

func BenchmarkSort(b *testing.B) {
	data := make([]int, 1<<10)
	b.ResetTimer() // ignore big allocation
	for i := 0; i < b.N; i++ {
		for i := range data {
			data[i] = i ^ 0x2cc
		}
		b.StartTimer()
		sort.Slice(data, func(i, j int) bool {
			return data[i] < data[j]
		})
		b.StopTimer()
	}
}
```

(Aside: Some of the sort benchmarks in the standard library allocate inside the loop. Oops. Carefully fixing this might make a nice first contribution for someone wanting to try their hand at the Go standard library.)

On my machine, executing this looks like:

```
$ go test -bench=. -count=5
goos: darwin
goarch: amd64
pkg: github.com/commaok/blog/content/post
BenchmarkSort-8   	   19536	     60568 ns/op
BenchmarkSort-8   	   19666	     60592 ns/op
BenchmarkSort-8   	   19569	     60674 ns/op
BenchmarkSort-8   	   19724	     61363 ns/op
BenchmarkSort-8   	   19705	     60792 ns/op
PASS
ok  	github.com/commaok/blog/content/post	11.772s
```

If the number of iterations looks funny to you, it's because you are used to seeing round numbers there. That also [changed in Go 1.13](https://golang.org/cl/112155/).

Now let's use the new `testing.B.ReportMetric` API to report the number of comparisons. To do this, we need to count the number of comparisons. Then we'll divide by `b.N`. The reason we must do the division ourselves is to allow metrics that aren't naturally represented as per-op counts, such as ratios or percentiles.

Here's the updated code, with added lines marked:

```go
func BenchmarkSort(b *testing.B) {
	var cmps int64 // <--------
	data := make([]int, 1<<10)
	b.ResetTimer() // remove allocation
	for i := 0; i < b.N; i++ {
		for i := range data {
			data[i] = i ^ 0x2cc
		}
		b.StartTimer()
		sort.Slice(data, func(i, j int) bool {
			cmps++ // <--------
			return data[i] < data[j]
		})
		b.StopTimer()
	}
	b.ReportMetric(float64(cmps)/float64(b.N), "cmps/op") // <--------
}
```

Running this yields:

```
$ go test -bench=. -count=5
goos: darwin
goarch: amd64
pkg: github.com/commaok/blog/content/post
BenchmarkSort-8   	   18523	     69874 ns/op	     10091 cmps/op
BenchmarkSort-8   	   18654	     64621 ns/op	     10091 cmps/op
BenchmarkSort-8   	   18657	     64589 ns/op	     10091 cmps/op
BenchmarkSort-8   	   18774	     64367 ns/op	     10091 cmps/op
BenchmarkSort-8   	   18704	     64408 ns/op	     10091 cmps/op
PASS
ok  	github.com/commaok/blog/content/post	12.062s
```

Note that the number of comparisons is stable. This is a wonderful property when benchmarking. It means you can run your benchmarks a small number of times, without quitting your browser or trying to disable thermal scaling or worrying about how your laptop CPU may be different from your production CPUs.

Now let's reach into the standard library and tweak something! There's a function called [`maxDepth` inside `package sort`](https://golang.org/src/sort/sort.go?s=5609:5622#L223):

```go
// maxDepth returns a threshold at which quicksort should switch
// to heapsort. It returns 2*ceil(lg(n+1)).
func maxDepth(n int) int {
	var depth int
	for i := n; i > 0; i >>= 1 {
		depth++
	}
	return depth * 2
}
```

(Aside: maxDepth should probably use `math/bits.Len` to calculate `ceil(lg(n+1))`. This is another candidate for a good first contribution to the Go core.)

Let's make `maxDepth` just return 0 instead and re-run our benchmark:

```
$ go test -bench=. -count=5 -run=NONE
goos: darwin
goarch: amd64
pkg: github.com/commaok/blog/content/post
BenchmarkSort-8   	   12618	     94792 ns/op	     17426 cmps/op
BenchmarkSort-8   	   12668	     94769 ns/op	     17426 cmps/op
BenchmarkSort-8   	   12642	     94645 ns/op	     17426 cmps/op
BenchmarkSort-8   	   12738	     94623 ns/op	     17426 cmps/op
BenchmarkSort-8   	   12654	     94431 ns/op	     17426 cmps/op
PASS
ok  	github.com/commaok/blog/content/post	12.867s
```

We can see that not only is it slower, but that it is clearly an algorithmic degradation: The number of comparisons has increased markedly.

[benchstat](https://godoc.org/golang.org/x/perf/benchstat) supports custom metrics, so we can use it to tell us exactly how much:

```
$ benchstat a b
name    old time/op   new time/op   delta
Sort-8   64.5µs ± 0%   94.7µs ± 0%  +46.76%  (p=0.016 n=4+5)

name    old cmps/op   new cmps/op  delta
Sort-8    10.1k ± 0%    17.4k ± 0%  +72.69%  (p=0.008 n=5+5)
```

There's one more trick worth worth mentioning. `testing.B.ReportMetric` generally overrides built-in metrics. If you call `b.ReportMetric(5, "allocs/op")`, then `go test` will report `5 allocs/op`, regardless of how much your benchmark actually allocated. There's one special case: `ns/op`. If set to `0`, then `ns/op` won't be reported at all. This is useful to avoid confusion or distraction if your benchmark's elapsed time is meaningless. For example, [one of the earliest uses of `testing.B.ReportAlloc`](https://golang.org/cl/166959/) was for a `package sync` benchmark that reported garbage collector stop-the-world time, in percentiles. It is irrelevant how long it takes that benchmark to run; only the percentiles matter.

On a sad note, there's currently [no good way](https://github.com/golang/go/issues/18454) to get profiling tools to tell you *where* a particular custom metric increased.

What else could you use `testing.B.ReportMetric` for? Obvious use cases include cache hit rates, I/O amounts, fast path/slow path heuristics, percentile reporting, and algorithmic improvements. (We measured comparisons during sorting here; how about swaps?) I'm sure there will be non-obvious ones as well.
