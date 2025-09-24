+++
date = "2025-09-23T07:12:48-07:00"
title = "Filter outputs and prime the pump"
+++

Two small context management tricks.

### Filter outputs

Some build tools are noisy. (Yes, I'm looking at you, `xcodebuild`.)

We _want_ our agents to re-build our projects regularly...but not at the cost of destroying their context window.

So I had an agent write a tiny shell script wrapper that strips away _everything but the error messages_ when builds fail. Successful build output is merely: "Build succeeded". It uses some awful regexps that only an LLM would write...but it's fast and it works.

My token use instantly dropped and the agent got more noticeably effective. And it turns out I prefer it too.

This is not new! The Unix philosophy says that when a program has nothing to report, it should remain silent.

[ESR's comment](https://www.catb.org/esr/writings/taoup/html/ch01s06.html#id2878450) on this rule is spot-on for both humans and LLMs:

> Well-designed programs treat the user's attention and concentration as a precious and limited resource, only to be claimed when necessary.

If your agent runs a build tool that wasn't designed by Rob Pike, invest in a dedicated wrapper to trim its output.

### Prime the pump

Even frontier models don't always listen, particularly if there are several important rules, and some of those rules fly in the face of their instincts (no mocks! use elemwise comparisons, not summary statistics!).

One way to drive a set of rules home is to ask the agent to start by looking for _violations of those rules_, knowing it won't find any. That fills the context window with a bunch of text about those rules, in effect showing--instead of telling--the agent what (not) to do.

This burns useful context window, but it significantly improves compliance. Sometimes this is a worthwhile trade-off. In constrast, I have found the opposite approach (wait for an agent to violate a rule, then ask it to self-correct) to be completely ineffective.
