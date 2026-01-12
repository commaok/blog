+++
date = "2026-01-12T07:12:48-07:00"
title = "Differential spec analysis"
+++

Differential techniques are chronically underappreciated in software. And they pair incredibly well with coding agents. Agents are now good enough that differential analysis can even be used to refine a spec, not just code.

The [Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html) is, as-written, about AI. It begins:

> The biggest lesson that can be read from 70 years of AI research is [...]

But the end of that sentence is far more broadly applicable than just AI. It continues:

> that general methods that leverage computation are ultimately the most effective, and by a large margin.

Even without billions of dollars of GPUs, and even without being able to utilize arbitrary amounts of compute, the ability to leverage computational power is phenomenally useful.

Differential testing and fuzz testing are prime examples. (Formal methods and theorem solvers too.) Differential techniques have many flavors, such as [differential coverage](https://research.swtch.com/diffcover). One lesser-known one is *differential spec analysis*.

In differential spec analysis, you write multiple implementations from a spec and then compare their behavior. It is most powerful when paired with fuzzing, but as we'll see, it even works without fuzzing.

Once any harness bugs have been resolved, deviations in behavior fall into two categories:

- implementation bugs, in which case your spec likely needs more unit tests or details
- ambiguity, in which case your spec is under-specified

Both outcomes teach you useful things about your spec, without ever looking at a single line of code, in any language.

Here's a worked example.

Drew Breunig recently published [whenwords](https://github.com/dbreunig/whenwords), which is a fun exploration of a [codeless open source repo](https://www.dbreunig.com/2026/01/08/a-software-library-with-no-code.html). The idea is that agents are now so good that publishing an excellent spec is sufficient to have top quality implementations on demand in any language you want.

A codeless repo is the perfect opportunity to try out differential spec analysis!

I cloned whenwords and asked Opus:

> Please write implementations of this in a half dozen languages, including Go. Prefer languages I already have installed on this machine. Use subagents for each language, and DO NOT LET THEM LOOK AT THE OTHER IMPLEMENTATIONS. I want each implementation to be de-novo. Then, using https://github.com/dvyukov/go-fuzz, write differential fuzz tests that invoke all the different implementations. Investigate any deviation between implementations. Note _all_ deviations. Deviations that are "just bugs" would be useful to add to the acceptance tests. Deviations that aren't "just bugs" but are instead differing reasonable interpretations of the spec would be useful to clarify in the spec. Keep a running document on disk of both kinds of failures.

Sadly, it didn't end up using fuzz testing, choosing instead to hand-roll the test suites, but it nevertheless came back with some interesting material.

It didn't quite finish the analysis, though, so I followed up with:

> Nice.
>
> So for the bugs, were there existing unit tests in tests.yaml that the sub-agents simply missed, or does it need new unit tests added? If the latter, please add them.
>
> For the ambiguities...please re-read the spec and triple-check that the spec is actually ambiguous about this. If it isn't ambiguous, then it's a bug, in which case, see the prior question (just a bug or a missing tests.yaml case?). If actually ambiguous, please make a judgment call about the best behavior and add it to the spec and also add "just enough" tests.yaml cases to cover it.

Here's what it found.

There were missing test cases around zero durations, which manifested as Swift crashes. Opus added these test cases:

```
  - name: "zero seconds"
    input: "0s"
    output: 0

  - name: "zero hours and minutes"
    input: "0h 0m"
    output: 0
```

There were missing test cases around month rounding, which manifested as incorrect Go outputs. Opus added:

```
  - name: "8 months ago - 229 days (tests rounding)"
    input: { timestamp: 1684281600, reference: 1704067200 }
    output: "8 months ago"
```

And there was an ambiguity in the spec about what to do with non-integer inputs to duration.

Opus suggested specifying rounding thus:

```
### Fractional input handling

When `duration()` receives a non-integer seconds value, first round to the nearest whole second using half-up rounding before decomposing into units. Examples:
- `duration(59.4)` → "59 seconds" (rounds to 59)
- `duration(59.5)` → "1 minute" (rounds to 60 seconds = 1 minute)
- `duration(0.4)` → "0 seconds" (rounds to 0)
```

With corresponding test cases:

```
  - name: "fractional - rounds down"
    input: { seconds: 59.4 }
    output: "59 seconds"

  - name: "fractional - rounds up to minute"
    input: { seconds: 59.5 }
    output: "1 minute"

  - name: "fractional - rounds to zero"
    input: { seconds: 0.4 }
    output: "0 seconds"
```

There are limitations. If your spec is clear but encodes the wrong decisions, differential spec analysis won't help.


*Thanks to Shaun Loo for providing feedback on a draft of this post.*
