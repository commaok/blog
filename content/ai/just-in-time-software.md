+++
date = "2025-12-20T07:12:48-07:00"
title = "Just in time software"
+++

I didn't plan to write software in the grocery store last night.

I was tired and hungry, kids in tow. My long shopping list sat in a text message. I wished I could check items off as I found them. Ideas filtered through my head:

- I could transfer the list to a piece of paper: too tedious
- I could copy/paste it into a notes app or an email draft and delete items: too much tapping
- I could search the web and app store for a thing that would do what I want (of which there were no doubt a great many): slow and painful and annoying

Nope nope nope nope nope.

Instead, I skulked over to a corner of the produce section, opened up [exe.dev](https://exe.dev) (the company I'm working at/on), tapped "New" to spin up a VM, put on my best "crazy person talking to himself" face, and dictated into my phone:

> Please make me a simple shopping list app. Here’s how it works. I can paste in the shopping list freeform, it splits it up into separate items then I can quickly tap a checkbox next to an item to strike it through. That’s it. All state is persisted entirely on the client.

Two minutes later, over in dairy, I pulled my phone back out; the site was ready. I copy/pasted in the text message. It worked. I checked off some items and kept shopping.

After grabbing some pasta, I got annoyed that I had to scroll up and down to see the items I was still missing. I hate UIs that move elements around on me, but still. I pulled up Shelley (the exe.dev per-VM coding agent) and dictated again:

> Please add a button that I can click to sort the completed items to the bottom of the list I don't want it to do this automatically because I want UI stability but I do want the option to say OK please go ahead and do the appropriate sorting don't filter them away don't get rid of them just sort them to the bottom

I returned to shopping. A minute later, a "Sort Completed to Bottom" button appeared. I tapped it. It worked. I finished shopping.


### Creating is faster than searching

My [ad hoc shopping app](https://shopping.exe.xyz) is not exactly groundbreaking. What's interesting is that I could summon exactly what I wanted into existence faster and with much less effort than finding a pre-built solution...or than doing my task without software, which is my usual go-to approach.

Many years ago, we visited a friend's mother's house over Christmas. We decided to make cookies to use up a big bowl of hazelnuts. There was only one problem. My friend's mother wandered around the house muttering "nutcracker, nutcracker, nutcracker". The house was built in the late 1700s and had spent the intervening centuries accumulating stuff. I read the writing on the wall and popped over to the nearest store and bought us a simple metal nutcracker.

Hours later, the nuts shelled, the cookies baked and eaten, my friend's mother yelled in delight: "I found it! The nutcracker drawer!" Yes, she had an entire drawer full of nutcrackers. In went the latest addition.

The internet is a giant colonial New England house, its innumerable drawers stuffed with things far weirder than nutcrackers.

If your needs are simple and easily explained, you are now best served by describing into existence the exact tool you want, at the moment you want it.


### Disposable software

There's a part of me that recoils in horror at the idea of single-use software. Disposable anything feels wasteful.

I knew someone who found that it was about the same price to buy new t-shirts as to wash the ones they had, so they filled landfills rather than walk to the laundromat. Ugghhh.

So I sat down today and did some rough order-of-magnitude calculations. The tokens used to build my website cost $0.34. (Or they would have if they were *a la carte*; exe.dev includes some free tokens.) That probably translates to about 5g of CO₂e, or driving a gas car some 75 feet. This feels acceptable to me.

The only other scarce resource consumed is the name `shopping.exe.xyz`. Oh well.

Also, I was using Claude Opus 4.5, the top of the line coding model, which was definitely overkill. And models are rapidly getting cheaper and more energy efficient.

Waste is waste, but also, hoarding is hoarding. Just in time software, written in the moment to match your needs, is the future.
