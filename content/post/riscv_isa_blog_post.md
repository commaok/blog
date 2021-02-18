+++
date = "2021-02-17T10:00:00-07:00"
title = "What happens when you load into x0 on RISC-V?"
draft = false
+++

A small thing of which I am irrationally proud: I was the proximate cause for the addition of a sentence to the [RISC-V ISA spec](https://github.com/riscv/riscv-isa-manual/releases/download/draft-20200727-8088ba4/riscv-spec.pdf).

Here's the sentence:

> Loads with a destination of x0 must still raise any exceptions and cause any other side effects even though the load value is discarded.

It's OK if you have no idea what that means. You will soon.

Here's the story.

# Background

In the summer of 2016, I wrote most of the initial RISC-V Go compiler implementation. ([Michael Pratt](https://github.com/prattmic) and [Benjamin Barenblat](https://github.com/bbarenblat) worked on the assembler, linker, and runtime, and other people [jumped in](https://github.com/sorear) and [ultimately completed the port](https://github.com/4a6f656c).)

I was writing the first version of the RISC-V SSA lowering rules. Those rules turn a generic, architecture-independent description of Go code into a RISC-V-specific set of operations that ultimately get lowered into RISC-V instructions.

One of those lowering rules specified how to lower a nil check.

# Nil checks in the Go compiler

Consider this code:

```go
type T struct {
    a [5000]byte // we'll explain this later
    b bool
}

func f(t *T) {
    _ = t.b
}
```

`f` does _almost_ nothing. But not nothing. `f` evaluates `t.b` for side-effects. If `t` is nil, `f` panics.

In the Go compiler, this is (unsurprisingly) called a nil check. The compiler arranges to execute an instruction that will fault if `t` is nil.

On amd64, `f` compiles to three instructions:

```
MOVQ	"".t+8(SP), AX
```

Get the value of `t` off of the stack and put it in the `AX` register.

```
TESTB	AL, (AX)
```

Load the value pointed to by `AX` and do something with it. The parens around `AX` mean dereference the pointer in the `AX` register. It doesn't matter here what the `TESTB` instruction does; it was chosen because it is short to encode. It's the deferencing that matters. If the load faults, the runtime will receive a signal and turn that into a panic.

```
RET
```

Return from the function. We only reach this instruction if we don't panic first.

# Implicit nil checks

Why does type `T` above contain a `[5000]byte` field?

There are *lots* of nil checks in a typical Go program. As an optimization, the runtime allocates a *guard page* at address 0, typically with size 4096 bytes. Any loads from an address < 4096 will fault.

As a result, if you're dereferencing a struct field with a small offset, we can directly attempt to load from the calculated address of that struct field. If the pointer is zero, then the calculated address will be < 4096, and it'll fault. There's no need for a separate, explicit nil check.

For example, if I had used `[20]byte` above, then `*t.b` requires loading from `t` plus 20. If `t` is nil (0), then that address is 20, which is located in the guard page.

Since we have a `[5000]byte` field above, the guard page isn't enough, so we need an explicit nil check.

This makes it sounds like explicit nil checks are exceedingly rare. They're not; they show up in other ways too.

# Back to RISC-V

I had to decide how RISC-V should lower explicit nil checks.

RISC-V has a dedicated *zero register*, `x0`. It always holds the value zero, and writes to it are discarded. It's like `/dev/null` and `/dev/zero` rolled into one.

It sounds like just the thing for a nil check: We can derefence the pointer and load the value into `x0`.

Here's `f`, compiled for RISC-V:

```
LD	"".t+8(SP), X3
LB	(X3), X0
JALR	X0, X1
```

It is almost identical to the amd64 version. The first instruction loads the pointer from the stack. The second instruction dereferences it into `x0`. The final instruction returns.

There was only one problem: Would it work?

# An ambiguity in the spec

If you're loading a value in order to discard it, do you really need to load it at all? if you're writing to `x0`, maybe you can just skip it.

There is an analog from amd64. The `CMOV` instruction does a conditional move. If a flag is set, then it loads or moves a value, and not otherwise. It shows up when compiling code like this:

```go
func g(x int) int {
	y := 1
	if x == 0 {
		y = 3
	}
	return y
}
```

The core of this function compiled for amd64 is:

```
TESTQ	AX, AX
MOVL	$1, AX
MOVL	$3, CX
CMOVQEQ	CX, AX
```

`TESTQ` sets the `EQ` flag if x is 0. The next two instructions put 1 in `AX` and 3 in `CX`. Last, if the `EQ` flag is set, we move `CX` into `AX`. `AX` now holds the correct value of y to return.

If a `CMOV` instruction includes a load from memory, that load is done unconditionally, even though the write of that value into the destination register is conditional.

I knew (and know) approximately nothing about hardware, but I can guess why this is a good decision. If you're doing out of order execution, you might not know yet what the flags are going to be when you reach that `CMOV` instruction. But memory loads are slow. We want to start that memory load early for maximum benefit. So it is useful to be able to do the load unconditionally, even if it is inconvenient for compiler developers.

But the same consideration doesn't really apply to RISC-V. There's no uncertainty about whether the instruction writes to `x0`. Skipping the load would be easy and cheap.

# Denouement

I asked my co-conspirators, and one of them asked [Andrew Waterman](https://www.sifive.com/about/andrew-waterman). 

He replied:

> We debated this hole in the spec at length, but neglected to write down the conclusion.

> The main reason we went with this definition is cleaner semantics for memory-mapped I/O loads that trigger side effects. The opposite choice is also defensible (it gives you a non-binding prefetch instruction for free). 

Light-years ahead of me, unsurprisingly. But convenient for Go's nil checks. And me having asked did help tie up one little loose end.
