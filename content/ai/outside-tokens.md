+++
date = "2025-10-21T07:12:48-07:00"
title = "Prompt injection is not about delimiters"
+++

[Bruce Schneier and Barath Raghavan](https://www.schneier.com/blog/archives/2025/10/agentic-ais-ooda-loop-problem.html) (via [Simon Willison](https://simonwillison.net/2025/Oct/21/ooda-loop/)) write:

> LLMs process token sequences, but no mechanism exists to mark token privileges. Every solution proposed introduces new injection vectors: Delimiter? Attackers include delimiters. Instruction hierarchy? Attackers claim priority. [...] Security requires boundaries, but LLMs dissolve boundaries.

This is a common theme in [discussions of prompt injection](https://www.alignmentforum.org/posts/D7PumeYTDPfBTp3i7/the-waluigi-effect-mega-post#Derrida___il_n_y_a_pas_de_hors_texte). There is no text that we can write that the attacker cannot write, so the battle is fundamentally unwinnable.

And it also seems...straightforwardly technically fixable?


This problem _is_ unsolvable if your entire LLM interface is text in / text out. But it doesn't need to be.

At least for open weights models, a simplified trace of an API call looks roughly like this:

1. Start with JSON containing a list of messages, each of which has text and some metadata (e.g. who wrote the message).
2. Assemble that JSON into a single textual string, inserting special magic strings (like `<|assistant|>`) to represent non-textual tokens.
3. Tokenize that string.
4. Send those tokens into the LLM.

...

Aside from [Conway's Law](https://en.wikipedia.org/wiki/Conway%27s_law), however, there's no reason to squish everything into a single string before turning it into tokens.

How does this help?

The metadata could include whether the message is untrusted text, which gets translated directly (outside the tokenizer) into a trusted or an untrusted token. Each message's text would be separately tokenized. And then the final list of tokens could be assembled from the trust tokens and the text tokens. Then send that into the LLM.

That is, instead of:

```
llm(tokenize(concat(message)))
```

We could do:

```
llm(concat([special_tokens(metadata), tokenize(text)]))
```

This lets metadata flow in a completely tamper-proof way from the API caller to the LLM. There is no text that an attacker can provide that will be translated into a trust token.

The LLM could then be post-trained (perhaps including using adversarial RL) to treat untrusted input positions as, well, untrusted.


Why does nobody do this? My best guess is that it is not the crux of the problem. (And presentations of prompt injection should perhaps stop being centered on it; it is intuitive but also a red herring.)

The real problem is the much deeper, harder, more general problem of getting strong-enough reliability guarantees out of these uninterpretable, unimaginably complex, probabilistic systems.

The alignment problem is the halting problem of LLMs, and I strongly suspect that solving prompt injection is equivalent to solving alignment.
