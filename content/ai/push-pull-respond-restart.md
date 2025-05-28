+++
date = "2025-05-27T07:12:48-07:00"
title = "How and when to talk with your AI Agent"
+++

There are obvious similarities between task-oriented communication with a human vs with an AI agent...and a few places where they diverge. This blog post lays out a simple conceptual framework for thinking about these interactions.

Suppose I ask a colleague to tackle a task for me. How do I communicate context about that task to them? There are three options:

- Push: Give them information up front
- Pull: Wait for them to ask me questions
- Respond: Provide feedback on work they've completed

Each of these approaches has trade-offs.

It's hard to know exactly what information would be useful to Push to them. Obviously they need to know what I have in mind, but telling them extraneous information is a waste of everyone's time, and in extreme cases can be downright obnoxious.

Pulling is less likely to generate unnecessary communication, but it also generates interruptions for me and adds delays for them. It can take a lot of work to even discover what questions to ask. And there's a difficult balance to strike between over- and under-asking.

Responding can be very efficient: It is naturally batched, and all the resulting communication is necessary. But it also generates wasted work along the way, and can lead to significant frustration if there were large communication failures earlier.

In practice, we all use a blend of these approaches. The exact combination depends on the people, the task, the existing shared context, the level of trust, and the relative cost of communication, interruptions, and work.

## Using agents

This same set of options appears when asking an AI agent to do work for you.

The more information you Push to them up front, the more likely you'll get a better outcome, but there are rapidly diminishing returns. Cutting-edge AI agent systems are capable of figuring out quite a lot on their own from surprisingly little context.

As the AI agents get more autonomous, though, they are used for bigger chunks of work, so they get slower, which means that you don't want to wait around to be available for Pulling, and interruptions are disruptive. And as agents tackle more on their own, it makes sense to launch more of them concurrently, which means that interruptions can easily saturate your focus bandwidth and sap your productivity.

I've started doing more at Response time, and worrying less about wasted work. An agent's work is cheap (compared to my time) and getting cheaper, and I can always just spin up more agents.

With agents, there's also a fourth option:

- Restart: Learn from the attempt, throw away everything, and start from scratch, Pushing the extra information that was missing the first time

(You can also do this with humans, but it's...not very nice.)

Adding Restart into the mix turns out to be surprisingly effective. Push a tiny bit of information, Respond only with significant feedback, learn from the result, Restart with better initial guidance, repeat.

[Marc-Antoine Ruel](https://maruel.ca) [explained this approach well](https://discord.com/channels/1362869091156758752/1362869091156758755/1369809064120553472):

> Often I ask it to create a change, look at the diff, realize it's wrong but it gave me an idea. I delete the branch and write the correct code manually. Then once it's scaffolded correctly, sometimes I let it finish the job. I find this faster (less draining emotionally?) than trying to argue.

(If you're skeptical about having AI-written code in your repo, this may be a thing to try. Let the AI run ahead, make mistakes, pave a path, and convince you that the game is worth the candle. Then write the code yourself, fore-warned and fore-armed.)

## Designing Agents

When building an AI agent, you encounter the same set of considerations, but from the design perspective. The product UX choices strongly influence when and how communication occurs.

For example, OpenAI's [DeepResearch](https://openai.com/index/introducing-deep-research/) settled on the user Pushing their question, then one immediate round of Pull, and then presumably Respond. (I personally have never done any Respond iterations with DeepResearch.) They judged that the [quick Pull improved results](https://twimlai.com/podcast/twimlai/how-openai-builds-ai-agents-that-think-and-act/) meaningfully without delaying or interrupting too much.

Here at Sketch (an AI coding agent), for human interactions, we've focused mainly on Respond and Restart. Yes, Pushed information to specify the task is necessary, but we want to be able to work well even with very little provided up front.

AI agents interact with their environments, and the same communication design questions arise for *agent-environment* communication as for *agent-human* communication. Take commit message styles; that information is available from git without bothering a human. We could analyze those and Push it to the agent at the very beginning. That's predictable and reliable, but is irrelevant overhead and distraction if no commits get created. Or we could Respond by asking it to rewrite a commit message if/when we automatically detect that it is not in the desired style. (Restarting is always human-initiated, so that's out.) In practice, we let the agent Pull that information when it is ready to write commits. And we have guard rails: If the agent hasn't Pulled style information, we refuse to let it commit.

The communication design is a prime question for us when adding any new feature. We employ a combination of all approaches, on a case by case basis, based on what happens to work well.

The field of Agent Experience (AX) is mostly ad hoc, currently mostly confined to prompt engineering and MCP server design. It will likely grow.

AI agents have hit the mainstream, but as an industry we have yet to develop a clear theory (that I have seen) around communication design, both UX and AX. Hopefully framing this question will help open up the discussion.

*Also published at [sketch.dev/blog/push-pull-respond-restart](https://sketch.dev/blog/push-pull-respond-restart)*
