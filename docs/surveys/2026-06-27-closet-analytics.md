# User Survey — Closet Statistics / Analytics screen

**Date:** 2026-06-27
**Target:** The Analytics view (`renderAnalytics`, `static/index.html:4712`) — AWEAR's "closet statistics": hero stats, Style Identity, Cost-Per-Wear (Wear Champion / Hidden Cost), Wardrobe Health bars, Dead Zone alert, Sustainability/Rewear score, category bars.
**Screenshot:** `/tmp/analytics.png` (before fix) → `/tmp/analytics_after.png` (after fix).
**Requested by:** founder (INBOX).

## Panel
~100 synthesized expert reviewers across three lenses, steered by domain subagents:
- **Design / visual** (lens: Gabbana) — benchmarked vs Instagram Insights / Pinterest Analytics / Zara.
- **Product** (lens: Ayalon) — fashion-tech PMs, sustainability + resale users; judged against the investor-demo "wow" bar.
- **Commerce / intelligence** (lens: Valentino) — Depop / Vinted power-users, circular-fashion analysts.

## Metrics (1–10, aggregate)
| Metric | Score | Lens |
|---|---|---|
| Design satisfaction | 5.5 | Design |
| Visual hierarchy | 6.0 | Design |
| Product value | 6.0 | Product |
| Wow for investors | 7.0 | Product |
| **Trust / credibility** | **3.0** | Product |
| Commerce intent | 5.0 | Commerce |

Charts: `survey1` (panel scores), `survey2` (Wardrobe Health before/after fix), `survey3` (issues by severity).

## Headline finding (SEVERE — Trust 3/10)
All three panels independently flagged the **same P0**: the screen rendered **independent hardcoded seed fallbacks next to live values**, producing on-screen contradictions:
- **100% utilization** stacked against **18% never-worn** (mathematically impossible — they don't share a denominator).
- **Active 92% + Never 18% = 110%** of one wardrobe.
- **Hidden Cost = "Satin Skirt · worn 1 time"** — a hardcoded *placeholder string*, not the user's closet (live path emits "worn 0 times").
- **Dead Zone = "3 items · $340"** fabricated even when no item is actually unworn.

On an analytics screen, the data layer *is* the product. An investor reading carefully catches the contradiction in one glance, and the whole surface flips from "this app knows my closet" to "demo with fake numbers."

## Conclusions (bullets)
- **Strong bones, broken data.** Style Identity ("The Quiet Minimalist"), dollar-quantified regret ("$340 sitting there", "$180 worn once"), and the decide→declutter→resell loop in one screen are genuinely demo-worthy and best-in-class for emotional/commerce framing.
- **The credibility bug was the single biggest risk** — consensus #1 fix-now from all three panels. Fixed this run.
- **Commerce intent leaks at the handoff:** the screen *names the money* ($340 dead, $180 hidden) but "List in My Store" carries no item context into the sell flow — the user restarts from a blank tab. (Proposed.)
- **The Rewear/Sustainability score is circular** (`rewearScore = utilization × 1.05` re-captioned as sustainability). Reviewers called it vanity math. (Proposed.)
- **Every insight is a dead end** — tapping "3 items in 60+ days" should reveal the 3 items with one-tap Wear/List, not fire a toast. (Proposed.)
- **Off-brand accent** — Style Identity + Wrapped gradients use `--accent3` purple, off the warm terracotta/camel brand. (Proposed.)

## Fixed now (this run — Valentino, verified)
One source of truth for every number in `renderAnalytics`:
- `hasWearData = totalWears > 0` gate; `utilizationPct`, `activePct`, `neverPct` all derive from the same `wardrobe` arrays. Seed constants (34/42/18) fire **only** when there is zero wear data. → Utilization 100% + Never Worn **0%** = 100, consistent.
- **Hidden Cost** now picks the real worst-cost-per-wear item → *Slip Satin Midi Dress · $145 · 2 wears · $73/wear*. Placeholder string gone.
- **Dead Zone** now derives count/value from real least-worn items → *"3 items are barely worn · ~$355"*, with truthful copy ("barely worn" when items aren't literally never-worn, since we infer from wear count, not dates).

Verified: `npm run check-render` ✓, re-screenshot confirms no contradiction.

## Proposed to IDEAS (bigger, awaiting prioritization)
1. **Wire "List in My Store" to carry the dead-zone item IDs** into the sell flow (`prefillListing(ids)`) + show forward payout ("List 3 · earn ~$190") instead of only sunk cost. Highest-leverage commerce fix.
2. **Make insights tappable / drilldown** — Dead Zone and Hidden Cost expand to the actual items with thumbnails + one-tap Wear/List.
3. **"What should I wear today?" card** at the top — convert the screen from a backward-looking report into a daily open-the-app reason (rules-based v1: temp + wear-recency + occasion).
4. **Single composite "Closet Health Score" with a month-over-month trend arrow** — one number investors remember that goes up (only after #1 data fix, which is now done).
5. **Honest sustainability score** — base on real rewear frequency / CO₂, not utilization×1.05.
6. **Theme + accent pass** — swap identity/Wrapped gradients from `--accent3` purple to warm `--accent`/`--accent2`; promote one signature metric for hierarchy.
