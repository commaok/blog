+++
date = "2026-02-07T07:12:48-07:00"
title = "Serpentine software"
+++

I don't usually write hot takes. But [StrongDM's Software Factory post](https://factory.strongdm.ai) is worth it, so here goes.

Their post is elegant, short, and well-written, so I'm going to just go through a bunch of pull quotes.

## Compounding correctness

> long-horizon agentic coding workflows [now] compound correctness rather than error

This is a big, empirical claim.

I'm already convinced by my own experiences that agents, suitably scaffolded, can form a [Brownian ratchet](https://en.wikipedia.org/wiki/Brownian_ratchet), such that pouring on more compute helps, on balance.

The claim that it compounds (implying exponentials!) is a *lot* stronger. There's also an implicit claim that that exponent is far enough above 1 to matter quickly. I don't see evidence of this yet.

And even if it is exponential, that might not by itself be enough. Experience suggests that software systems get non-linearly more difficult as they grow and age. And so far, experience suggests that adding more coding agents means that projects grow faster than usual. Even compounded, will the correctness added outrun the complexity they induce? The answer is not obvious, either way, and history suggests a modicum of skepticism.

[Russ Cox](https://research.swtch.com/vgo-eng):

> Software engineering is what happens to programming when you add time and other programmers.

The [StrongDM techniques](https://factory.strongdm.ai/techniques) is a fascinating take on what software engineering for agents looks like. But making all that work in practice means building a lot of mechanism around your software: serious black box integration tests, substantial CI infrastructure.

If you're building a significant piece of software, you might be able to amortize that investment. But that's just the traditional economic model of software: high fixed cost, low marginal cost. The lump under the rug may have shrunk, but it's still there.

But there's a different timeline available: [small, highly bespoke, disposal software](/ai/just-in-time-software/). You don't need software engineering for that, it works today, and it's cheap. And we've known for decades that this was a good idea. Worse is better.

Not all software can be small. Large projects enable small projects! But if I had to place bets, I'd say [Zipf's Law](https://en.wikipedia.org/wiki/Zipf%27s_law) will apply, and almost all software in the future will be small.

## Unlearning helplessness

> Those of us building software factories must practice a deliberate naivete

This applies to all software engineers. I am not building software factories, and I am still frantically unlearning habits of a lifetime. [It's hard](https://commaok.xyz/ai/vibed-static-analysis/).

## Sometimes you have to ship

> Why am I doing this? (implied: the model should be doing this instead)

Overhead matters. [xkcd's Is It Worth the Time](https://xkcd.com/1205/) is evergreen. That chart may have shifted, but it's still real. I should be in the loop less, but dead reckoning still has its limits.

## We don't even need Goodhart's Law

> If you haven't spent at least $1,000 on tokens today per human engineer, your software factory has room for improvement.

[Simon Willison](https://simonwillison.net/2026/Feb/7/software-factory/) comments on this:

> If these patterns really do add $20,000/month per engineer to your budget they’re far less interesting to me.

These are both facially rather silly, because the units are nonsense. As Warren Buffet points out: "Price is what you pay, value is what you get."

I could hit $1,000/engineer-day easily by signing up for Anthropic's new [10x more expensive fast plan](https://code.claude.com/docs/en/fast-mode). The real point here, I assume, is that we (outside StrongDM) are currently so underinvested in LLM spend that a big head-turning number is guaranteed to be both directionally and magnitudinally correct.

The response also misses the important metric. If an engineer spends $20k/month to generate the equivalent of hiring 10 more engineers, this is hugely interesting. Particularly so when you take into account the management and coordination overhead of every additional engineer.

The relevant metric is a hopelessly squishy combination of execution speed, quality, predictability, overhead, and all the other factors that software teams juggle (cf [Sean Goedecke's writing](https://www.seangoedecke.com)).

Plus, we have two battling exponentials: hardware gets cheaper and models get bigger. Will tokens get cheaper? Maybe. Will "code impact per dollar" go up? Yes. Will it go up exponentially? Maybe.

## Better, not cheaper

> Code must not be written by humans

Indeed.

As of Opus 4.5, I read a lot of code. I write almost no code.

I loved writing code. I'm good at it. But Claude now makes fewer basic code-level mistakes than I do, by a country mile.

I even use English to describe changes I want to see that I could make in fewer keystrokes and in less time by editing the code directly. But I don't, because I *screw up basic things* at a rate far higher than Claude. I still wield refactoring tools, including vibe-coded refactoring tools, because they're solid and faster than Claude.

> Code must not be reviewed by humans

When I said above that I read a lot of code, what I meant was that I skim it.

I don't look for simple mistakes; the [prevalence effect](https://en.wikipedia.org/wiki/Prevalence_effect) means that even if there are any, I won't see them.

Also, I don't read code until an agent has read it a few times first.

When I do finally skim, I look for architecture, for key decisions, for decisions that impact UX or DX: places where my experience and knowledge and judgment and taste has leverage.

For now, I'm convinced that my time doing that is a net win, even with a giant token budget. Importantly, it also enables me to continue to know enough to continue to meaningfully work on the code.

## Integrate all the things

> A test, stored in the codebase, can be lazily rewritten to match the code.

StrongDM's efforts started with Sonnet 3.5. Reward hacking was far more prevalent then. It's rare now, and adding agents cross-checking work eliminates it.

We have a [mostly-hermetic integration suite](https://commaok.xyz/ai/codebase-as-prompt/) at [exe.dev](https://exe.dev). It is proving to be one of the better investments we made. It also takes a lot of work to maintain: it grows with the software, and CI speed matters, whether it's generating a pass/fail grade or a satisfaction ratio.

We store it alongside the code. Claude adds to it, usefully. At some point, good overlapping test coverage and momentum means it will always be more appealing to make the tests pass by fixing the code than cheating.

And sometimes humans in teams decide to "cheat", but we call it "making a sensible engineering decision". The distinction between cheating and exercising judgment is very blurry.

I have never once felt a need to externalize our tests. This feels like path-dependence in StrongDM's journey.

## Serpentine vs double-brick walls

> the Agentic Moment has profoundly changed the economics of software

[Kevin Barrett](https://kevinbarrett.org/blog/low-background-code/) wonders whether code written before 2025 will turn out to be like [low background steel](https://en.wikipedia.org/wiki/Low-background_steel): useful because it is unpolluted by what humans have done to themselves.

I suspect pre-2025 software will be more like [serpentine brick walls](https://en.wikipedia.org/wiki/Crinkle_crankle_wall).

Wavy brick walls are cool, but they also have a more useful property: they can be built with fewer bricks, because the undulations add strength and stability. When bricks are expensive, but labor cheap, they make economic sense.

Modern walls are double-brick straight masonry. They use more bricks, but they're much less labor intensive. Bricks are cheap nowadays, but labor is expensive.

Pre-2025 software may prove to like crinkle crankle walls: economically rational for the constraints they were built under. Thin, elegant, surprisingly strong, and carefully designed to fit their landscape.

Post-2025 software might end up like double-brick walls: thick, inelegant, solid through sheer volume, but fundamentally still a fine wall.
