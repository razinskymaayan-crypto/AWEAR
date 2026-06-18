# AWEAR Products Data

## Overview

`products.json` is a static product catalog containing 65 fashion items across 6 categories.
All images are sourced from Unsplash (free license).

## Structure

Each product object contains:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier, format `prod_NNN` |
| `name` | string | Product display name |
| `brand` | string | Fictional brand name |
| `category` | string | One of: `shoes`, `pants`, `tops`, `jackets`, `accessories`, `dresses` |
| `color` | string | Primary color(s) |
| `price_estimate_usd` | number | Price in USD |
| `image_url` | string | Unsplash CDN URL (600x600, auto-crop) |
| `search_query` | string | Text query that describes the product for search/AI matching |
| `tags` | string[] | Style tags for filtering |
| `in_stock` | boolean | Availability flag |

## Categories

| Category | Count | Price Range (USD) |
|---|---|---|
| `shoes` | 11 | 65–185 |
| `pants` | 10 | 68–110 |
| `tops` | 10 | 28–85 |
| `jackets` | 10 | 120–385 |
| `accessories` | 10 | 38–260 |
| `dresses` | 10 | 75–165 |

**Total: 65 products**

## Image URLs

All images follow the pattern:
```
https://images.unsplash.com/photo-{NUMERIC_ID}?auto=format&fit=crop&w=600&q=80
```

Images are served at 600px width, 80% JPEG quality, with auto-crop.

## Usage

### Fetch all products
```js
const res = await fetch('/data/products.json');
const products = await res.json();
```

### Filter by category
```js
const shoes = products.filter(p => p.category === 'shoes');
```

### Filter in-stock only
```js
const available = products.filter(p => p.in_stock);
```

### Filter by tags
```js
const minimal = products.filter(p => p.tags.includes('minimal'));
```

## Brands (Fictional)

- **Studio Basics** — essentials & basics
- **Meridian** — smart-casual staples
- **Volta** — streetwear & urban
- **Solène** — feminine & elegant
- **Cove / Cove Denim / Cove Athletics / Cove Jewelry** — casual & versatile
- **Atelier Nine** — premium & elevated
