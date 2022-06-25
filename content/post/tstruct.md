+++
date = "2022-06-24T08:12:48-07:00"
title = "Nicer struct literals in Go templates"
draft = false
+++

Go templates (`text/template`, `html/template`) accept a single argument to render. That's generally enough when you're executing them from Go code. But when invoking a template from another template, you often want to pass multiple things to it.

For example, we might have a template that renders a nav bar item. It requires a title, a url, and an "enabled" bool. We want to invoke it from another template.

How do you do that?

In this post I'll review the existing options and then discuss [a new one I'm working on](#a-new-approach).

# Existing options

## dict

You can combine multiple key/value pairs into a map. [Define a "dict" function in your FuncMap and call it from your template.](https://stackoverflow.com/a/18276968/)

This might look like:

```
{{ template "navbar" dict "title" "Home" "url" (urlNamed "home") "enabled" true }}
```

This is flexible and gets the job done. But it is a bit of a blob and has no type safety.

## Do it all in Go code

Define a nav bar item struct:

```go
type NavBarItem struct {
    Title string
    URL string
    Enabled bool
}
```

Construct the nav bar item in your Go code using a struct literal. Pass it into your template, and then pass it along to the nested template.

This works, but it splits your content into two places. And it can be annoying to thread everything through. It is not so much a solution to the problem as it is giving up on solving the problem.

## tmplfunc

[tmplfunc](https://pkg.go.dev/rsc.io/tmplfunc) converts templates to functions. If you define the navbar template using `{{ define "navbar title url enabled" }}`, then tmplfunc arranges for it to be callable:

```
{{ navbar "Home" (urlNamed "home") true }}
```

This adds a bit of type safety, but not much. As the list of parameters grows, it loses readability. It only works with template execution; you can't use it to define a local variable. And it requires that you replace the template parsing pipeline with `tmplfunc`.

# A new approach

The new approach I'm experimenting with is to define a Go struct for the template input (as above) and then autogenerate corresponding FuncMap entries. This provides a template syntax for writing struct literals.

My initial attempt at this is [package tstruct](https://github.com/josharian/tstruct).

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

This is a bit more verbose, but I find it far more readable. It is pretty type safe, and it is flexible; you can reorder and omit any of the field arguments.

Package tstruct also supports map and slice fields. For example, given this struct type:

```go
type Example struct {
    Map map[string]int
    Slice []int
}
```

After calling `tstruct.AddFuncMap[Example](m)`, you can write:

```
{{ $x := Example (Map "a" 1 "b" 2) (Slice 5 6 7) }}
```

`x` now contains the value:

```go
Example{
    Map: map[string]int{"a": 1, "b": 2},
    Slice: []int{5, 6, 7},
}
```

If it helps with clarity, you can also build maps and slices incrementally. This yields identical results:

```
{{ $x := Example
    (Map "a" 1)
    (Map "b" 2)
    (Slice 5)
    (Slice 6)
    (Slice 7)
}}
```

You can also define custom setters for struct fields with named types; look for `TStructSet` in the [tstruct readme](https://github.com/josharian/tstruct/blob/main/readme.md).

# FuncMap name collisions

FuncMaps are global, so if you already have an entry called `NavBar`, then package tstruct can't (or rather, won't) add one to construct `NavBar` structs. Similarly, tstruct can't add two structs with the same name, or a struct with the same name as a struct field.

As a special case, however, tstruct supports using the same struct field name across different structs, even if they have different types. (This is possible because the "field setter" FuncMap entry is only fully evaluated by tstruct itself in the context of a specific struct type.)

Fortunately, most FuncMap functions start with a lower case letter, and tstruct only works with exported struct fields, so there's some amount of convention-based namespacing.

# Caveats

As of June 2022, this is fairly novel, both the idea (I think) and the implementation (definitely).

I expect the API and details to evolve as I use this more and (hopefully) hear from others using it. Please [file issues](https://github.com/josharian/tstruct/issues) with feedback, bugs, and ideas. If it ends up being popular, I'll try to push towards a stable v1.
