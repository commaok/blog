+++
date = "2026-02-12T07:12:48-07:00"
title = "Coding agents and the rules of the road"
+++

I heard a story from someone who works on self-driving cars.

These cars were originally programmed to follow the letter of the law, the contents of the DMV manual that people briefly memorize every five years during renewal season.

But people don't drive according to the letter of the law, they drive according to the rules of the road.

If two cars arrive at the same time at a four-way stop, in theory, the one on the right has priority. But actual drivers use car movement to signal and coordinate. One car rolls forward slightly, the other one cedes. If both cars roll forward at the same time, they both stop, and you try again. Just like passing someone in a hallway or taking turns talking on a high latency connection, this can get awkward, but it eventually works.

When a letter-of-the-law car meets a human driver, the self-driving car gets stuck. The self-driving car doesn't roll (the law says no!), the human sees this and rolls forward, the self-driving car yields for safety...and another human shows up to take their place.

Self-driving cars had to learn to drive the way humans drive in order to function in the real world.

I see the same setup in the world of coding agents, but I think the dynamics here may be flipped.

Coding agents try to follow the letter of the law. Claude really wants me to set all the appropriate HTTP headers. But I know from experience that nobody much cares. The internet long ago settled on a norm of pragmatic permissiveness. The letter of the law (RFCs) says to do it, but the rules of the road (Postel's Law) say that it is unimportant bordering on pedantic.

The self-driving car analogy suggests that coding agents will eventually adapt to human behavior.

But the cost of just letting Claude add the headers is low. This isn't a noisy linter warning, it's an automated code formatter. Claude fixes it for me reliably and the code weight is small. When the marginal cost of compliance is negligible, compliance rises.

As coding agents' share of code written goes up, they may have a regularizing side-effect of slowly changing the rules of the road to match the letter of the law. Coding agents may do for internet standards what spell-checkers did for typos.
