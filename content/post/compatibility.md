+++
title = "Compatibility: Not just about code"
date = "2019-02-06T16:05:13-08:00"
draft = false
+++

The [Go 1 compatibility promise](https://golang.org/doc/go1compat)
was designed to ensure "that Go 1 will be a firm foundation
for the development of Go and its ecosystem."

[Go 2 is coming.](https://blog.golang.org/go2-here-we-come)

[Ian Lance Taylor](https://github.com/ianlancetaylor) has written a
masterful, thoroughly researched
[design document](https://github.com/golang/proposal/blob/master/design/28221-go2-transitions.md)
about "how to make incompatible changes from Go 1 to Go 2 while breaking as little as possible".


Interestingly, both documents are clearly geared towards code and APIs.

A few examples from the Go 1 compatibility promise (emphasis added):

> It is intended that *programs* written to the Go 1 specification will continue to *compile and run correctly, unchanged*, over the lifetime of that specification.

<!-- -->

> Compatibility is *at the source level*.

<!-- -->

> Of course, for all of these possibilities, should they arise, we would endeavor whenever feasible to update the specification, compilers, or libraries *without affecting existing code*.


And from the Go 2 transitions proposal (emphasis added):

> A key feature of these options is that *code compiled* at different language/library versions can in general all be linked together and work as expected.

<!-- -->

> While we can provide tooling to *convert pre-1.20 code into working 1.20 code*, we can't force package authors to run those tools.

<!-- -->

> This can be used to take incremental steps toward new language versions, and to make it easier to *share the same code* among different language versions.


---


As we all know, however, there is much more to a language's ecosystem than the extant body of code.
There is culture. There is infrastructure, like conferences and training. There is tooling. There is trust.
There is an aesthetic. (Ian Lance Taylor's takeaway from the history of C++: "A new version may have a very different feel while remaining backward compatible.")

And then there is a giant, sprawling, chaotic mess of documentation,
ranging from official docs to blog posts to Stack Overflow to mailing list archives and beyond.

This organic documentary hodgepodge is invaluable.
With the help of search engines, it ensures that most questions
will have multiple answers written in different ways, at different levels, by different authors.
This is a great boon, particularly to newcomers to a language.

A year ago or so, I needed to write something in Swift. The single biggest pain point by far
was that when I searched for examples and discussion, I found answers written
for Swift 2, Swift 3, and Swift 4. I ended up having to simultaneously learn three dialects
of Swift and how to translate between them. This situation also commonly arises with popular libraries.

My code was brand new, so I didn't care that the language had changed in incompatible ways.
But it sure did break the documentation ecosystem in a deep way.
And docs, unlike code, are impossible to [go fix](https://blog.golang.org/introducing-gofix).

Of course, docs do go stale even when there is backwards compatibility. For example, strings.Builder
made some old performance advice obsolete. But such breakage is relatively localized, easy to repair gradually,
and not particularly damaging to people who find it instead of up-to-date docs.

The [tentatively](https://github.com/golang/go/issues/20706) [accepted](https://github.com/golang/go/issues/19308)
[Go 2](https://github.com/golang/go/issues/28493) [changes](https://github.com/golang/go/issues/19113)
look unlikely to break much documentation,
and the discussion so far on the [many Go 2 proposals](https://github.com/golang/go/labels/Go2) give no particular reason for concern.
Nevertheless, as we all ponder Go 2, it's probably worth explicitly thinking about
compatibility in terms much broader than working code.
