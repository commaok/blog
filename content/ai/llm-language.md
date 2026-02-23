+++
date = "2026-02-22T07:12:48-07:00"
title = "Fight fire with pedantry"
+++

Over the last two years, I've heard a bunch of speculation about how to design a programming language specifically for an LLM. It usually centers around typechecking, formal verifiability, or context engineering. It's a fun thought experiment, but always felt aimless.

First, my experience has been that designing for humans is the best way to design for an LLM, as long as you restrict yourself to text. Second, being in-distribution is so critical that there's no point unless you're also training a frontier coding model. And in that case, what are you doing designing a programming language?

But a suggestive [post by Terence Tao about AI slop in mathematics](https://inuh.net/@tao@mathstodon.xyz/116117405232069678) offers a rich framework for thinking about this.

> One possible solution is to introduce _selective friction_, making it harder (or less convenient) to publish a mediocre AI-generated idea than a promising one. One can see this philosophy in the design of programming languages, which often tend to promote a certain set of "good" programming practices by making them easy to implement in the language, while "bad" practices, while not completely prohibited, are made to be inconvenient to adopt in that language. [Many] selective friction features of programming languages are in the process of being erased by the powerful coding abilities of modern AI.

At its best, selective friction embeds hard-won wisdom, born of observing the long term consequences of engineering decisions at scale. It drives engineers towards better designs, left of boom. (Or more commonly, in the case of technical debt, left of a giant whimper.)

This selective friction was designed with humans in mind. But humans are significantly more responsive to effort gradients and to cultural norms than coding agents.

As models get more powerful, they will become _more_ capable of powering through messes, which may further exacerbate this problem. This mirrors a problem that some very smart humans have: They are so good at explaining away inconvenient facts that they take longer to accept that they are wrong. Doing RL with extremely long time horizons--the evolution and maintenance of an entire codebase, not individual tasks--might result in models that don't benefit from nudges from their language. But I'm not holding my breath.

Designing a programming language for an LLM might mean recognizing this trend and leaning into it hard by cranking the coefficient of friction way past 11.

Programming languages designed for humans have upper limits to what they can require, on pain of being too annoying to use. LLMs will power through requirements that humans find intolerable, so we can ask more of them.

Here are some ideas:

- It could forbid variable shadowing. In the extreme form, all code must be in SSA form.
- It could enforce extremely strict naming conventions, in the interest of increasing local information density.
- It could require docs on absolutely everything.
- It could support extensive compiler-checked pre- and post-conditions.
- It could require annotating functions as being pure (or not), as being able to panic/throw (or not), as allocating memory (or not).
- It could limit the number of parameters to a function to three.
- It could require that all boolean parameters be named types with associated constants.
- It could require that every type and function be [in its own file](/post/perf_files/) with a predictable filename.

Much of this sounds roughly like "more typechecking" and "formal verifiability" and "designed for efficient context use". But it does so around a unifying theme: giving up on human usability in order to add guardrails.

All of these ideas come with trade-offs, and they might not be net wins. Or they might not go far enough: The models might manage to dance around them. These are empirical questions. With the advent of LLMs, the cost of testing them is within reach.

The real point of this blog post is to open up the design space. Could an unbearably opinionated, pedantic programming language yield better agent-written code?

Also: You don't need a new programming language for this. Start with a strongly-typed, tool-friendly language like Go or Rust and start layering on "compile-time" requirements, and see what happens. This keeps the code much more in-distribution and enables rapid prototyping.

At exe.dev, we've scratched the surface of this with some [vibe-coded static analysis tools hooked up to CI](/ai/vibed-static-analysis/). But I'd be curious to see what happens when someone who loves pragmatic programming languages or frameworks adopts some [deliberate naivete](https://factory.strongdm.ai), lets out their inner language lawyers, and really plumbs these depths.
