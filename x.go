package main

import (
   "fmt"
   "math"
   "math/rand"
   "time"
)

// do performs a request with exponential backoff and jitter
func do() error {
   const (
   	maxAttempts = 10
   	baseDelay   = 1 * time.Second
   	maxDelay    = 60 * time.Second
   )

   for attempt := 1; attempt <= maxAttempts; attempt++ {
   	err := request()
   	if err == nil {
   		return nil
   	}

   	if attempt == maxAttempts {
   		return fmt.Errorf("failed after %d attempts: %w", maxAttempts, err)
   	}

   	// Calculate exponential backoff: base * 2^(attempt-1)
   	delay := time.Duration(float64(baseDelay) * math.Pow(2, float64(attempt-1)))
   	if delay > maxDelay {
   		delay = maxDelay
   	}

   	// Add jitter: ±25% random variation
   	jitter := time.Duration(rand.Float64()*0.5-0.25) * delay
   	delay += jitter

   	time.Sleep(delay)
   }

   return nil // unreachable
}

// request is a stub representing the actual work
func request() error {
   // Your actual request logic here
   return fmt.Errorf("simulated failure")
}