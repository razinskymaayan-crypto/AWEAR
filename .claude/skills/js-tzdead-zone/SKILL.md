---
name: js-tzdead-zone
description: Prevent JavaScript Temporal Dead Zone (TDZ) crashes — const/let are NOT hoisted. Use before adding new constants/variables to static/index.html, especially in global scope or near render functions called early.
---

# JavaScript TDZ — const/let Are Not Hoisted

## What happened (2026-06-17 — postmortem)

`renderHome()` was called at line 2272 (initial page load). Inside it, the "daily challenge" card
used `RW_KEY` and `LEVELS` — constants defined at line 2786, **after** `renderHome()` in the file.

In JavaScript, `function` declarations are hoisted (accessible anywhere in scope). `const`/`let`
are **not** — they sit in a "temporal dead zone" until the line that declares them executes.
Result: `renderHome()` crashed mid-execution. `#home-wrap` stayed blank. The bug passed JS
syntax validation (the code was parseable) and only surfaced in a real browser.

## The rule

> Any `const` or `let` defined in global scope that is used inside a function must be defined
> **before** the first call to that function in the execution order.

## Before you add a new constant

1. Find where the constant will be used:
   ```bash
   grep -n "MY_CONST\|myFunction" static/index.html | head -30
   ```

2. Find the first line that calls the function using your constant:
   ```bash
   grep -n "renderHome\|renderFeed\|init" static/index.html | head -20
   ```

3. Your `const` declaration must be at a **lower line number** than that first call.

## Quick check after adding code

```bash
# Find all const/let in global scope and the functions that use them
grep -n "^const \|^let " static/index.html | head -40
```

Then cross-reference: if `renderX()` is called at line N, every `const`/`let` it touches must be
declared at line < N.

## The trap to watch for

```js
// ❌ WRONG — renderHome() called at load time, LEVELS used inside it
renderHome();            // line 100 — crashes here
// ... hundreds of lines ...
const LEVELS = [...];   // line 800 — TDZ until here
```

```js
// ✅ RIGHT — constants defined before first use
const LEVELS = [...];   // line 50
renderHome();            // line 100 — safe
```

## When to run verify-rendering

After any change that adds new `const`/`let` to global scope or moves a function call earlier in
the file, run the `/verify-rendering` skill — TDZ bugs are invisible to syntax checks but visible
in 10 seconds of real browser load.
