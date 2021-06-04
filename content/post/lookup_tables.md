+++
date = "2021-06-03T10:00:00-07:00"
title = "Make your lookup table do more"
draft = false
+++

Lookup tables are powerful micro-optimization tools, because they implement arbitrary transformations in cheap constant time.

And yet we often do not use them to their full potential. This post is the story of one example.

# A good starting point

In a recent blog post, [Daniel Lemire rediscovered a technique for calculating the base ten length of a uint32](https://lemire.me/blog/2021/05/28/computing-the-number-of-digits-of-an-integer-quickly/#comment-585804). Start by calculating integer `log2(x)`, do an approximate integer division to translate `log2(x)` to `log10(x)`, and then fix up the result as needed.

His code, with some annotations:

```c
static uint32_t table[] = {
	9, 99, 999, 9999, 99999, 999999,
	9999999, 99999999, 999999999,
};
int y = (9 * int_log2(x)) >> 5; // log10(2) ~= 0.301, 9/32 ~= 0.281
y += x > table[y]; // use lookup table to discover off-by-one due to using integer math
return y + 1;
```

The initial calculation gets us close to the right answer. The lookup table steps in to handles numbers like 9 and 10. `log2(9)` is equal to `log2(10)`, so we need some way to distinguish them. `9 * log2(x) >> 5` yields 0 for both 9 and 10. Comparing `x` to `table[0]` tells us to increment the result for 10, but not for 9. Then we increment again, yielding the correct result: 1 for 9, 2 for 10.

But lookup tables let us do arbitrary transformations, and we're getting only a single bit out of it: Increment or not. For example, maybe we could work that increment at the end of the function into the lookup table somehow. (Yes, that increment is free on amd64 architectures with a good enough compiler by using the `ADC` instruction.)

# Some groundwork

If we used a lookup table to modify the original input, then we would be in a better place to absorb some of the later work. For any given power of two range (e.g. 8–15), there is at most one transition from an n digit number to an n+1 digit number. For the range 8–15, that transition is from 9 to 10. For the range 16–31, there isn’t one.

My [first attempt at using this observation](https://lemire.me/blog/2021/05/28/computing-the-number-of-digits-of-an-integer-quickly/#comment-585476) was to use a lookup table to translate base 2 transitions (7 to 8) to line up with base 10 transitions (9 to 10).

My code:

```c
static uint32_t table[] = {
	0, 0, 0, (1<<4) - 10,
	0, 0, (1<<7) - 100,
	0, 0, (1<<10) - 1000,
	0, 0, 0, (1<<14) - 10000,
	0, 0, (1<<17) - 100000,
	0, 0, (1<<20) - 1000000,
	0, 0, 0, (1<<24) - 10000000,
	0, 0, (1<<27) - 100000000,
	0, 0, (1<<30) - 1000000000,
	0, 0,
};
x += table[int_log2(x)]; // adjust input to align base 2 and base 10 transitions
int ans = (77*int_log2(x)) >> 8; // log10(2) ~= 0.301, 77x/256 ~= 0.301
return ans + 1;
```

Consider the inputs 9 and 10. We start with integer log2, which yields 3 in both cases. Then we add `table[3]`, which is 6. This transforms 9 and 10 into 15 and 16. Now if we take the integer log2 again we get 3 and 4. Integer division and an increment yields the correct result (1 and 2).

This doesn’t actually reduce any of the other post-lookup-table work, but it sets us up to do so.

Note that the table has grown from 9 uint32s to 32 uint32s. This is probably acceptable.

# A small step forward

The [next iteration](https://lemire.me/blog/2021/05/28/computing-the-number-of-digits-of-an-integer-quickly/#comment-585555) looks like this:

```c
static uint64_t table[] = {
	16, 14, 12, 246, 240, 224, 3996, 3968, 3840,
	64536, 64512, 63488, 61440, 1038576, 1032192,
	1015808, 16677216, 16646144, 16515072, 267435456,
	267386880, 266338304, 264241152, 4284967296,
	4278190080, 4261412864, 68619476736, 68585259008,
	68451041280, 1098511627776, 1098437885952,
	1097364144128,
};
uint64_t n = (uint64_t)(x) + table[int_log2(x)];
return int_log2(n) >> 2;
```

The non-lookup calculations here have gotten simpler. The table is a lot more complex, but that’s OK. That complexity is computationally free! The table has also grown again, from 32 uint32s to 32 uint64s. If speed matters, this is probably acceptable. (And if it doesn't matter, go implement something obvious instead.)

The basic idea is the same as before. Add an offset to each base 2 range to translate base 2 transitions onto base 10 transitions. But now we also tack on extra amounts to make our post-lookup calculations computationally cheaper: a single shift, instead of a multiply, a shift, and an increment. Adding `table[3]` to 9 and 10 make them 255 and 256. `log2(255) / 4` is 1 and `log2(256) / 4` is 2, as desired.

# A great leap forward

That’s where I left it. Then [Kendall Willets stepped in and made a marvelous leap](https://lemire.me/blog/2021/05/28/computing-the-number-of-digits-of-an-integer-quickly/#comment-585916). The code below is from [Daniel Lemire’s follow-up blog post laying out Kendall's approach](https://lemire.me/blog/2021/06/03/computing-the-number-of-digits-of-an-integer-even-faster/):

```c
static uint64_t table[] = {
      4294967296,  8589934582,  8589934582,
	  8589934582,  12884901788, 12884901788,
	  12884901788, 17179868184, 17179868184,
	  17179868184, 21474826480, 21474826480,
	  21474826480, 21474826480, 25769703776,
      25769703776, 25769703776, 30063771072,
	  30063771072, 30063771072, 34349738368,
	  34349738368, 34349738368, 34349738368,
	  38554705664, 38554705664, 38554705664,
	  41949672960, 41949672960, 41949672960,
      42949672960, 42949672960,
};
return (x + table[int_log2(x)]) >> 32;
```

Lookup tables can implement arbitrary functions! Kendall embeds two pieces of information in a uint64: the integer log10 for that base 2 range in the top 32 bits and the transition translation (if any) in the bottom 32 bits. The table is eye-watering, but your CPU doesn't care.

Consider 9 and 10 again. `table[3]` is `8589934582`, which is `(2<<32) - 10`. Adding 9 and 10 to that yields `(2<<32) - 1` and `2<<32`. If we now shift right 32 bits, this yields 1 and 2 respectively. Voilà!

We now require only an integer log2, a table lookup, an addition, and a shift. Not bad.


My three takeaways:

* Lookup tables implement arbitrary transformations at a constant cost. If you have one in your code, it’s worth asking whether it can do more work for you.

* Open collaboration can be delightful, with thoughtful people. Three people’s combined insights and refinements broke new ground (I believe) on an old question. I'm not sure any of us would have gotten there alone.

* This is an existence proof that there are websites on the internet where it’s worth reading the comments.
