# AWEAR Static Data

Demo/seed data for the AWEAR SPA and mobile app. Three canonical files
(`products.json`, `posts.json`, `profiles.json`) plus five source fragments
(`_products_*.json`).

## products.json

Static product catalog: **200 products** across 6 categories, real brands,
real retailer image/product URLs.

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier, format `prod_{XX}_{NNN}` (see prefix table below) |
| `name` | string | Product display name |
| `brand` | string | Real brand name (see brand list below) |
| `category` | string | One of: `top`, `bottoms`, `outerwear`, `shoes`, `hat`, `accessory` |
| `subcategory` | string | Finer grain, e.g. `jeans`, `short-sleeve`, `trench coat`, `sneakers` |
| `color` | string | Primary color(s) |
| `description` | string | Short marketing-style description |
| `price_estimate_usd` | number | Price in USD (canonical currency; convert per locale at display time) |
| `image_url` | string | Product image on the brand/retailer CDN (not Unsplash) |
| `product_url` | string | Product page on the brand/retailer site |
| `search_query` | string | Text query describing the product for search/AI matching |
| `tags` | string[] | Style tags for filtering |
| `in_stock` | boolean | Availability flag |

### Id prefixes

| Prefix | Contents | Category |
|---|---|---|
| `prod_ss_` | short-sleeve shirts (20) | `top` |
| `prod_ls_` | long-sleeve shirts (20) | `top` |
| `prod_sh_` | shorts (20) | `bottoms` |
| `prod_lp_` | long pants / trousers (20) | `bottoms` |
| `prod_jn_` | jeans (20) | `bottoms` |
| `prod_jk_` | jackets (20) | `outerwear` (18) + `bottoms` (2 jeans: `prod_jk_019`, `prod_jk_020`) |
| `prod_ct_` | coats (20) | `outerwear` |
| `prod_sw_` | shoes (20) | `shoes` |
| `prod_ht_` | hats (20) | `hat` |
| `prod_ac_` | accessories (20) | `accessory` |

Note: id prefix does not always equal category — `prod_jk_019`/`prod_jk_020`
are jeans (`bottoms`) that live under the `jk` prefix. Always filter by the
`category` field, never by id prefix.

### Categories

| Category | Count | Price Range (USD) |
|---|---|---|
| `top` | 40 | 19.95–510 |
| `bottoms` | 62 | 24.99–600 |
| `outerwear` | 38 | 70–1490 |
| `shoes` | 20 | 75–210 |
| `hat` | 20 | 28–75 |
| `accessory` | 20 | 52–219 |

**Total: 200 products**

### Brands (real)

7 For All Mankind, A.P.C., AG Jeans, ALDO, ARKET, ASICS, ASPESI,
Acne Studios, Adidas, Banana Republic, Barbour, Birkenstock, Brixton, COS,
Calvin Klein, Camper, Carhartt, Carhartt WIP, Citizens of Humanity, Clarks,
Columbia, Daniel Wellington, Dickies, Gap, H&M, J.Crew, Kangol,
Karl Lagerfeld Jeans, Le Specs, Lee, Levi's, Mango, Mejuri, Missoma, Nike,
Nudie Jeans, Old Navy, Patagonia, Polo Ralph Lauren, Puma, Rains,
Ralph Lauren, Sam Edelman, Save The Duck, Silvian Heach, Stüssy, TOTEME,
The Frankie Shop, The North Face, Timberland, Tommy Hilfiger, UGG, Uniqlo,
Vans, Weekend Max Mara, Wrangler, Zara.

### Image URLs

`image_url` points at each brand/retailer's own CDN (e.g. `imgcdn.carhartt.com`,
`www.stussy.com`, `assets.adidas.com`). These are external hotlinks — expect
occasional breakage; the frontend must handle image load failure gracefully.
(An earlier version of this catalog used Unsplash; that is no longer the case.)

## posts.json

**40 posts**, ids `post_001`..`post_040`.

| Field | Type | Description |
|---|---|---|
| `id` | string | `post_NNN` |
| `user_id` | string | References `profiles.json` `id` (`user_NNN`) |
| `image_url` | string | Local path, e.g. `/static/img/users/tamar/look1.jpg` |
| `caption` | string | Post caption |
| `items_tagged` | string[] | Product ids from `products.json` (1–3 per post; may be empty) |
| `likes` | number | Like count (demo value) |
| `comments` | number | Comment count (demo value) |
| `created_at` | string | ISO 8601 UTC, e.g. `2026-06-17T10:15:00Z` |

**Every id in `items_tagged` MUST exist in `products.json`.** Orphan ids broke
all feed item-pills on 2026-07-04 (incident BE-TAG-INTEGRITY) — see Integrity
section below.

## profiles.json

**20 profiles**, ids `user_001`..`user_020`.

| Field | Type | Description |
|---|---|---|
| `id` | string | `user_NNN` |
| `username` | string | Handle |
| `display_name` | string | Display name |
| `avatar_url` | string | Local path, e.g. `/static/img/users/tamar/avatar.jpg` |
| `bio` | string | Short bio |
| `location` | string | City/country string |
| `joined` | string | `YYYY-MM` |
| `style_tags` | string[] | Style descriptors, e.g. `casual`, `y2k`, `minimal` |
| `followers` / `following` / `posts_count` | number | **Intentionally inflated demo numbers** — do NOT expect them to match actual counts in `posts.json` |
| `verified` | boolean | Verified badge flag |

## _products_*.json (source fragments)

The five `_products_*.json` files (`shirts`, `shorts_pants`, `jeans_jackets`,
`coats_shoes`, `hats_accessories`; 40 products each) are the source fragments
that were merged into `products.json`. **`products.json` is canonical** — the
fragments are kept for provenance only. Known drift: `image_url` was updated
in `products.json` after the merge, so all 200 ids differ from their fragment
copies on that field (the integrity script reports this as a warning).

## Usage

```js
const res = await fetch('/data/products.json');
const products = await res.json();

const shoes = products.filter(p => p.category === 'shoes');
const available = products.filter(p => p.in_stock);
const minimal = products.filter(p => p.tags.includes('minimal'));
```

## Integrity

Run the integrity checker **before committing any change to these files**:

```bash
python3 scripts/data_integrity.py
```

It verifies (errors fail with exit code 1): JSON parses, unique ids,
no orphan `items_tagged` product ids, `posts.user_id` -> `profiles.id`,
and per-file field validation. Fragment drift, duplicate image URLs and
unreferenced products are reported as warnings. Exists because of
BE-TAG-INTEGRITY (2026-07-04): orphan product ids silently broke 100% of
feed item-pills and a manual spot-check missed it.
