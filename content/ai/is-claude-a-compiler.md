+++
date = "2025-05-23T15:12:48-07:00"
title = "Is Claude a compiler?"
+++

I was lucky enough to attend the Code with Claude conference yesterday.

The hands-down highlight was the talk by [Erik Schluntz](https://erikschluntz.com): Vibe coding in prod.

Among other things, he drew an analogy between LLMs and compilers.

Once upon a time, people wrote assembly. No more.

Compilers are better. Compiler bugs got ironed out, and trust developed. Not many people write assembly by hand any more. (I am one of them, at times.)

So, he says, it will be with Claude. It'll get more reliable, we'll develop trust, and eventually, not many people will write code by hand. (Will I be one of them? I already mostly vibe-code.)

There are a few obvious ways in which this analogy breaks down. I want to explore a few of them, as a means of taking his arguments seriously.


# Reliability

Compiler reliability is extremely, extremely high. Got a bug? It is in your code, not the compiler. (Until it's not. I've personally authored enough compiler bugs to last several lifetimes.)

Will LLM reliability get that high? I'm definitely not going to say no. I take exponential curves seriously.

But one major challenge is that the way that compilers get so reliable is through sheer code miles.

You can backtest a compiler with a phenomenal amount of code. The implicit regression test is massive.

LLMs are non-deterministic. The really hard bugs to find and fix in a toolchain are non-deterministic ones due to things like memory corruption and race conditions.

The rarer and more heisen the bug, the greater the effort required to find and address it. If there are only a few rare bugs, you might decide to live with them. But if there's a fat tail of rare bugs, the ride gets bumpy. (This is true of human health. Any _given_ rare disease is rare, but having _a_ rare disease is not uncommon.)

It is an open, empirical question what distribution LLM reliability problems have. But there could be dragons here.

Setting aside determinism, LLMs are also orders of magnitude more compute intensive to run. Backtesting at a scale close to compilers is cost prohibitive.

Will hardware advances save us? With exponential cost reductions and speed improvements, today's cost prohibitive is tomorrow's chump change.

There are two exponentials at play here, though: exponential hardware improvements and exponential AI quality improvements. And they are at odds with each other. If the exponential AI quality improvements are predicated on scaling laws, then exponential hardware improvement needs to have a bigger exponent than AI quality improvement. Given the limits of physics, there might be dragons lurking here too.

There's also a second-order reliability effect. In addition to not introducing bugs, compilers eliminate entire classes of bugs, as do memory-safe languages. These effects compound. LLMs still generate more severe bugs than humans, not just merely more bugs.


# Trust

I trust the compiler a _lot_ more than I trust Claude. And I trust Claude more than any other LLM.

Most trust is, in practice, earned from reliability.

But there's also supply chain security style trust. That's more challenging.

Compilers are not immune. [Trusting Trust](https://research.swtch.com/nih) is very old and has aged well.

But compilers do not have quite the scope for mischief that LLMs do.

We understand compilers well. They are highly interpretable. And the attack surface area is small compared to an internet's worth of training text.

And determinism helps immensely. Security breaches are bad, but undetected security breaches are far worse. The fact that the [xz attack](https://en.wikipedia.org/wiki/XZ_Utils_backdoor) was caught due to a minor performance impact is telling.

Lastly, the very same exponentials that drive LLM performance cut the other way too, at least right now: The more powerful the model, the higher the risk of invisible security problems.

I hope we develop a level of confidence and insight into LLMs comparable to compilers. It is early days.

The reality is, though, that I trust my compiler (in the security sense) mainly because I have no choice. Our lives are built extremely deeply around trust, from the food we eat to the multi-ton chunks of steel that we ignore as they whizz past us, mere feet away. So it may soon be with LLMs.


# So...?

Where does that leave us?

I believe, like Erik, that the decline of hand-written code will accelerate, soon, possibly precipitously, but mainly for economic reasons. LLMs are dramatically cheaper to run than humans are to employ.

We are rapidly moving towards a world in which LLMs write the code, whether the reliability and trust can match compilers or not. The era of bespoke software is upon us.

We are still paying the price for building the internet and other foundational software technologies...and then tacking on security afterwards. This pattern looks set to repeat with LLMs. Long tail risks are notoriously hard to find funding for: There are always competitors happy to run risks, and executives happy to throw away their umbrellas in a rainstorm because they're not getting wet.

If LLMs can't make up the missing ground with compilers, and fast, there will be a lot of whiplash.

We all have work to do.
