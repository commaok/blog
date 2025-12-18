+++
date = "2025-12-16T07:12:48-07:00"
title = "Self-healing software"
+++

Traditional software is [repeatable](https://commaok.xyz/ai/is-claude-a-compiler/), fast, and efficient, but brittle.

LLM agents are flexible, but [unreliable](https://www.dbreunig.com/2025/12/06/the-state-of-agents.html), slow, and inefficient.

I have started using a hybrid model, *self-healing software*: traditional software whose failures trigger coding agent intervention. The agent examines what went wrong, edits the software until it works again, and retries. [1]

Weirdly, for self-healing software, brittleness is a feature. The resiliency comes from the agent. You *want* their judgment involved when conditions change. Make lots of assertions, accept no fallbacks.

(All of this obviously has serious prompt injection problems! As always, consider the provenance of your inputs and the blast radius of failures.)

To make this more concrete, here's a recent example.

I wanted to scrape my kids' report cards from their school's website. I trust the website, but it is unstable, unpleasant to use, and has no API.

I started an [exe.dev](https://exe.dev) VM for isolation and set up a cron that runs a shell script:

- start a headless browser
- run a series of Playwright scripts
- on success, send me the results
- on error, invoke yolo claude with the error log and the goals

Normal runs are fast and effective. When something goes wrong, Claude patiently struggles with query selectors and screenshots until it works again, and commits the changes. I remain blissfully unaware.

[1] This sounds superficially similar to the [Ralph Wiggum](https://ghuntley.com/ralph/) approach to software. But here, the agent is mostly dormant: it only engages when something goes wrong, which means that most runs go smoothly. And the self-healing component can be scoped more narrowly to fit as a smaller piece of a larger project.
