# FOUNDER QUESTIONS — daily steering loop

**Why this file exists:** agents must NOT guess product direction and build things that later get
reverted. When an agent hits a fork it cannot resolve from a locked spec, it **asks here** and works
on something else meanwhile. Once a day Carmel/Razi answer; answered items become directives that
top the backlog. Then the loop repeats. (OW-012)

**The daily cadence:**
1. Agents append direction questions to `## OPEN` as they work (with options + a recommendation).
2. Once a day, Carmel/Razi move each answered item to `## ANSWERED` with the chosen direction.
3. Agents execute `## ANSWERED` directives at top priority (after a broken build), then mark them
   `[done]` and move them to `## ARCHIVE`.

---

## How agents write a question (format)
```
### Q<n> — <one-line question>  ·  <agent>  ·  <YYYY-MM-DD>  ·  loop-stage: SCAN|MATCH|LOOKS|BUY|EARN|—
What I'm blocked on: <1-2 sentences — the fork I can't resolve from a spec>
Options:
  A) <option>  — <consequence>
  B) <option>  — <consequence>
  C) <option>  — <consequence>
My recommendation: <A/B/C + one-line why>
What I'll do meanwhile: <the other task I picked so I'm not idle>
```

## How founders answer
Edit the question's block, add a line `ANSWER (Carmel/Razi, <date>): <the direction>`, and move the
whole block to `## ANSWERED`. Or reply in Telegram with `/answer Q<n> <direction>` (routed here).

---

## OPEN (need founder direction)
_(empty — agents append here)_

---

## ANSWERED (directives — execute at top priority, then archive)
_(empty — founders move answered items here)_

---

## ARCHIVE (done)
_(completed directives move here with a one-line note)_
