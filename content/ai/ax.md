+++
date = "2025-05-30T07:12:48-07:00"
title = "AX: Agent Experience"
+++


[Wikipedia](https://en.wikipedia.org/wiki/User_experience):

> User experience (UX) is how a user interacts with and experiences a product, system, or service.

> Developer experience (DX) is a user experience from a developer's point of view.

It is time to add:

> Agent experience (AX) is a user experience from an AI agent’s point of view.


[Agent loops are simple](https://sketch.dev/blog/agent-loop). But that simplicity hides some depth. An agent's behavior is deeply influenced by its environment. (The same is true of humans.) To build a setting in which an agent is effective, it helps to view the world from its point of view.

The primary components of AX are obvious and familiar: the system prompt, and the tool selection, naming, design, and documentation. All of these must be designed for how LLMs process information, with [an strong emphasis on clarity and precision](https://sketch.dev/blog/prompt-engineering-and-the-taste-gap).

There are less obvious components, though, such as [communication design](https://sketch.dev/blog/push-pull-respond-restart): what information you give an agent and when.

And some of it, as with any form of UX, comes down to polish. We [just added auto-installation of common tools](https://github.com/boldsoftware/sketch/commit/495c1fa247565e21b36bcb847c6cd3f08e0e196f) to [sketch](https://sketch.dev). If an agent executes yamllint, and yamllint isn’t present, it is silently, magically installed in the container, and the bash command succeeds the first time. Instead of having to pause its work to futz with apt/snap/yum/brew, which is [a distraction](https://arxiv.org/abs/2505.06120), things Just Work. AI agents suffer from yak shaving too.

AX is in some sense easier than UX/DX, because you have captive users that you can watch any time you want! It is so much easier that we sometimes call it “eval” instead.

But it’s not just eval. To improve the AX, you have to actually watch and empathize, just like you would with human users…while bearing in mind the ever-changing ways in which they can be decidedly non-human.
