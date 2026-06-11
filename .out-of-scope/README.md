# Out of scope

This directory holds requests the project has **explicitly declined**, with the reason. The goal is twofold:

1. **Transparency.** Anyone who later proposes the same thing can find the prior decision and the reasoning, instead of restarting the debate.
2. **Reducing repeat work.** Maintainers can point to an existing file and say "this is why" without re-deriving the argument.

## How to add a new entry

Create a new file at `.out-of-scope/<short-slug>.md` with this shape:

```markdown
# <One-line title of the declined request>

## What was requested

<A short, neutral restatement of the request. Quote the original ask if possible.>

## Why this is out of scope

<The reason. Keep it sharp — the goal is for a future reader to understand the
decision in under a minute.>

## Prior requests

- <link or reference to the original issue, discussion, or commit, if any>
```

Slug conventions:

- Kebab-case, action-oriented, no date prefix.
- Keep slugs stable. Renaming breaks the "Prior requests" links.

There are no entries yet. The first declined request becomes `0001-...md` style in spirit (a slug) but without the leading number — files here don't need to be ordered, they need to be findable.
