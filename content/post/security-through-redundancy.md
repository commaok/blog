+++
date = "2025-09-15T07:12:48-07:00"
title = "Security through intentional redundancy"
+++

When writing a service, it's very easy to accidentally forget to check permissions or ownership of an object.

This code has a gaping security hole in it:

```go
func (s *Server) deletePhoto(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
	s.db.DeletePhoto(id)
}
```

_Anyone_ who gets ahold of a photo ID can delete that photo.

Developers often address this through middleware, but such middleware tends to get complicated and thus error prone.

The problem is that `DeletePhoto` API has an insecure design: The caller must actively remember to check permissions before calling it. It fails open.

One approach to fixing this is to add redundant arguments.

Let's change:

```go
func (db *DB) DeletePhoto(id string) error
```

to this:

```go
func (db *DB) DeletePhoto(id string, owner *User) error
```

The owner parameter is, strictly speaking, redundant. The photo ID already uniquely identifies its owner.

But now, the caller needs a `*User` to use the API. They'll probably reach for the most convenient one.

```go
func (s *Server) deletePhoto(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    // grab user set by middleware
    user, _ := r.Context().Value("user").(*User)
    s.db.DeletePhoto(id, user)
}
```

This is the path of lowest resistance to calling `DeletePhoto`. A developer (or an LLM) might write this code without thinking about security at all...and yet, it's pretty solid, because `DeletePhoto` can enforce that the photo must be owned by the provided user. Only one person (the author of `DeletePhoto`) had to think about security. Everyone else gets it for free. This API fails closed.

This approach works across many programming languages, and at many different API levels.

My favorite is SQL, usually via [sqlc](https://sqlc.dev/). For example, change the query from:

```sql
DELETE FROM photos WHERE id = ?;
```

to:

```sql
DELETE FROM photos WHERE id = ? and owner_id = ?;
```

The main challenge I've encountered with this in the past is that people will want to refactor the code to remove the clutter. It can take some convincing.

This trick isn't a panacea (nothing is), but it definitely helps. And in an era in which serious amounts of code is being written by LLMs, with only local information, secure-by-default APIs look increasingly appealing.
