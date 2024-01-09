+++
date = "2024-01-09T09:12:48-07:00"
title = "Sometimes Software is Done, or Why Hugo Why"
draft = false
+++

I didn't sit down this morning planning to write a grouchy blog post about Hugo.

When I first used Hugo I loved it. It was fast. It was simple. It just worked, as much as any software does, and it solved a real problem.

It was done.

---

But people kept working on it.

I'm sure that it has been improved in countless ways. But along the way it has gotten bigger and more complicated, and has broken backwards compatibility repeatedly.

---

I am only inspired to write a blog post every few months. It takes a lot of self control to forgo the glittering pile of side projects and use my precious free time to write some words instead of code.

I commit to myself: Today is the day! I will finally tackle one of the items from my blog post idea list!

And then...

I run `hugo`...

And it scribbles all over my files, a slew of unimportant changes, unfortunately occasionally interspersed with a few that matter...

And it warns me of new deprecations, often with unusable upgrade instructions...

And things flat out break.

(Often, they were deprecated and then broken entirely between two subsequent blog posts, so I never ever saw the deprecation.)

Instead of writing a blog post, I spend hours fixing build failures.

Build failures of my static site, which has maybe a few dozen posts.

I don't care about Hugo's internals. I have never cared. I just want a blog that works.

---

Enough complaining. Hugo is officially on the chopping block. Suggestions for alternatives welcome.

And in the meantime, I'll just compile Hugo myself from source, never update it, and live in the ever receding past.

---

Backwards compatibility matters. And sometimes, software is done.
