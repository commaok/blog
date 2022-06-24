+++
date = "2022-06-24T08:12:48-07:00"
title = "Nicer struct literals in Go templates"
draft = false
+++

Go templates (`text/template`, `html/template`) accept a single argument to render. That's generally enough when you're executing them from Go code. But when invoking a template from another template, you often want to pass multiple things to it.

As a simple, running example, we might have a template that renders a single nav bar item. It requires a title, a url, and a bool indicating whether it is enabled. We want to invoke this nav bar template several times.

How do you do that?

In this post I'll review the existing options and then discuss [a new one I'm working on](#a-new-approach).

# Existing options

## dict

You can combine multiple key/value pairs into a map. [Define a "dict" function in your FuncMap and call it from your template.](https://stackoverflow.com/a/18276968/)

This might look like:

```
{{ template "navbar" dict "title" "Home" "url" (urlNamed "home") "enabled" true }}
```

This is flexible and gets the job done. But it is hard to read (which are the pairs?) and has no type safety.

## Do it all in Go code

Define a nav bar item struct:

```go
type NavBarItem struct {
    Title string
    URL string
    Enabled bool
}
```

Construct all the nav bar items in your Go code using a composite literal. Pass it into your template.

This works, but it splits the content between the Go code and the template. And it can be hard to thread everything through. It is not so much a solution to the problem as it is giving up on solving the problem.

## tmplfunc

[tmplfunc](https://pkg.go.dev/rsc.io/tmplfunc) converts templates to functions. If you define the navbar template using `{{define "navbar title url enabled"}}`, then tmplfunc arranges for it to be callable:

```
{{ navbar "Home" (urlNamed "home") true }}
```

This adds a bit of type safety (it checks the spelling of "navbar"), but not much. As the list of parameters grows, it loses readability. It only works with template execution, not local variables. And it requires that you wrap the entire template parsing pipeline.

# A new approach

The new approach I'm experimenting with is to define a Go struct for the template input (as above) and then autogenerate FuncMap entries to construct it. My initial attempt at this is [package tstruct](https://github.com/josharian/tstruct).

First, we hook the `NavBarItem` struct up to the FuncMap:

```go
m := template.FuncMap{ /* your func map here */ }
err := tstruct.AddFuncMap[NavBarItem](m)
// handle err
```

We can now call the template like this:

```
{{ template "navbar" NavBarItem (Title "Home") (URL (urlNamed "home")) (Enabled true) }}
```

This is a bit more verbose, but I find it far more readable. It is pretty type safe, and it is flexible; you can reorder and omit any of the arguments.

Package tstruct also supports map, slice, and struct fields. Map and slice elements are added one at a time. For example, given this struct type:

```go
type Example struct {
    Map map[string]int
    Slice []int
}
```

After a quick `tstruct.AddFuncMap[Example](m)`, you can write:

```
{{ $x := Example (Map "a" 1) (Map "b" 2) (Slice 5) (Slice 6) (Slice 7) }}
```

`x` now contains the value:

```go
Example{
    Map: map[string]int{"a": 1, "b": 2},
    Slice: []int{5, 6, 7},
}
```

You can also define custom setters for named struct fields types; look for `TStructSet` in the [readme](https://github.com/josharian/tstruct/blob/main/readme.md).

# Caveats

FuncMaps are global, so if you already have an entry called `NavBar`, then package tstruct can't (won't) add one to construct `NavBar` structs. And tstruct can't add two structs with the same name, or a struct with the same name as a struct field. As a special case, however, tstruct supports using the same struct field name across different structs, even if they have different types. (This is possible because the "field setter" FuncMap entry is only fully evaluated by tstruct itself in the context of a specific struct type.) Fortunately, most FuncMap functions start with a lower case letter, and tstruct only works with exported struct fields, so there's some amount of built-in namespacing.

As of June 2022, this is fairly novel, both the idea (I think) and the implementation (definitely). And the implementation uses reflection, indirection, delayed execution, and recursion, each of which is independently hard to reason about and which collectively push the limits of my abilities, [at least to debug](https://www.laws-of-software.com/laws/kernighan/).

I expect the API and details to change as I use this more and (hopefully) hear from others using it. Please [file issues](https://github.com/josharian/tstruct/issues) with feedback, bugs, and ideas. If it ends up being popular, I'll try to push towards a stable v1.
