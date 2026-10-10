# Tab & Tip

Independent restaurant reviews in Chattanooga, TN. Every meal paid for, every visit unannounced, scored on the full 1 to 10 scale.

Hand-coded in HTML, CSS and JavaScript. Hosted on Cloudflare Pages.

## Project layout

```
tab-and-tip/
├── index.html           homepage
├── reviews.html         all reviews, with filters and sorting
├── our-standards.html   how reviews and scores work
├── styles.css           one stylesheet for every page
├── data/
│   └── reviews.json     every review (later: the database)
└── js/
    ├── data.js          shared: categories, neighborhoods, score weights, card builder
    ├── home.js          fills in the homepage
    └── reviews.js       filters and sorting on the All Reviews page
```

## Running it locally

The pages load `data/reviews.json` with `fetch()`, and browsers block that when you double-click an HTML file (`file://`). Run a small local server from this folder instead.

**Mac (Python is usually already installed):**

```
cd path/to/tab-and-tip
python3 -m http.server 8000
```

Then open http://localhost:8000 in Safari. Press `Ctrl + C` in Terminal to stop it.

## Adding a review (for now)

Add an entry to `data/reviews.json`. The fields:

| Field | Example | Notes |
|---|---|---|
| `id` | `10` | unique number |
| `slug` | `"the-place-southside"` | used in the review's URL; lowercase, hyphens |
| `name` | `"The Place"` | |
| `cuisine` | `"tacos"` | must be a slug from `CUISINES` in `js/data.js` |
| `hood` | `"southside"` | must be a slug from `HOODS` in `js/data.js` |
| `scores` | `{ "food": 8, "service": 7, "value": 6, "atmosphere": 7 }` | 1 to 10 each |
| `verdict` | `"..."` | one line, shown on cards |
| `notes` | `{ "food": "...", ... }` | the back of the check, a few sentences per category |
| `links` | `{ "website": "", "menu": "", "map": "" }` | full URLs |
| `photo`, `photoAlt` | `"images/the-place.jpg"`, `"Al pastor tacos"` | alt text describes the photo |
| `visits` | `2` | |
| `paid` | `64.50` | total spent, tip included |
| `visitDate` | `"2026-10-01"` | YYYY-MM-DD |
| `status` | `"published"` or `"draft"` | drafts never show on the site |

The overall score is **not** stored. It's calculated from the four category scores using `WEIGHTS` in `js/data.js`, so the total can never disagree with the ticket.

## Roadmap

1. ~~Move reviews out of the HTML into `reviews.json`~~ ✓
2. ~~Database: Cloudflare D1~~ ✓
3. API: Cloudflare Pages Functions (`/api/reviews`)
4. Login: hashed passwords, secure session cookies, rate limiting
5. Critics' portal: dashboard, review editor, draft / publish, photo upload
6. Tests, architecture diagram, security write-up
