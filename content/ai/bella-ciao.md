+++
date = "2026-05-20T07:12:48-07:00"
title = "Bella Ciao with LLMs"
+++

"Pelicans on bicycles" is kinda saturated. (As would be "Pelicans on bicycles jumping a shark.")

But here's a thing that models are currently pretty terrible at: Generating tolerable music with nothing but normal linux tools.

I spun up an [exe.dev VM](https://exe.dev) (disclosure: co-founder) and asked [Shelley](https://blog.exe.dev/shelley):

```
Please spin up nginx and have it serve from ~/static.

For every model available via the LLM gateway, spin up a subagent using that model with prompt:

Without using the Internet, working in /tmp/MODELNAME, generate an audio file of Bella Ciao, playable in an average web browser, and then drop the final result in ~/static/bella_ciao_MODELNAME.<ext>

Once all those are done, make an index file for all of them, so I can see and play them all. Mobile friendly.
```

You can hear the results at [bella-ciao.exe.xyz](https://bella-ciao.exe.xyz).

Warning: They're pretty terrible and occasionally painful to listen to. Horrible synth, weird tempos, sometimes not even recognizably the right melody. That's kind of the point, though.

I find GPT 5.5 to be the standout, and even that is...kinda ouch.

You can hear the model improvements within a family, if you can hang on long enough, although I find Opus 4.6 to be nicer than Opus 4.7, perhaps because it's weirder.

I also had Shelley add a table with details about the making of the musical sausage to the bottom of the page.

Enjoy.
