+++
date = "2025-05-30T07:12:48-07:00"
title = "Simpler backoff"
+++

Exponential backoff with jitter is de rigeur for making service calls. This code, or something like it, probably looks really familiar:

```
func do(ctx context.Context) error {
	const (
		maxAttempts = 10
		baseDelay   = 1 * time.Second
		maxDelay    = 60 * time.Second
	)

	delay := baseDelay
	for attempt := range maxAttempts {
		err := request(ctx)
		if err == nil {
			return nil
		}

		delay *= 2
		delay = min(delay, maxDelay)

		jitter := time.Duration(rand.Float64()*0.5-0.25) * delay // ±25%
		sleepTime := delay + jitter

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(sleepTime):
		}
	}

	return fmt.Errorf("failed after %d attempts", maxAttempts)
}
```

But we can make this much nicer with a simple [lookup table](/post/lookup_tables/).

```
func do(ctx context.Context) error {
	delays := []time.Duration{
		1 * time.Second, 2 * time.Second,
		4 * time.Second, 8 * time.Second,
		16 * time.Second, 32 * time.Second,
		60 * time.Second, 60 * time.Second,
		60 * time.Second, 60 * time.Second,
	}

	for _, delay := range delays {
		err := request(ctx)
		if err == nil {
			return nil
		}

		delay *= time.Duration(0.75 + rand.Float64()*0.5) // ±25%
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(delay):
		}
	}

	return fmt.Errorf("failed after %d attempts", len(delays))
}
```

This is much simpler. There are fewer variables, with smaller scope. There's no need to reasoning about behavior across loops, and if there's a bug in the calculations, it won't affect subsequent iterations.

It is more readable. It is obvious how it will behave. It is also more editable. Changing the backoff schedule and number of attempts now feels safe and trivial.

Don't write code that generates a small, fixed set of values. Use a lookup table instead.
