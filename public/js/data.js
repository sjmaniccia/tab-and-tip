// data.js — shared by every page that shows reviews.
//
// Everything about WHAT the site covers lives here, in one place:
// the food categories, the neighborhoods, and how the overall score is weighted.
// Change a list here and every dropdown, tile and card on the site follows.
//
// This file is a module: other files pull pieces out of it with
//   import { loadReviews, CUISINES } from './data.js';
// Only things marked "export" can be imported.


// ---------- What the site covers ----------
// slug  = the short value used in URLs and data files (no spaces, no capitals)
// label = what visitors actually see
export const CUISINES = [
  { slug: 'tacos', label: 'Tacos' },
  { slug: 'burgers', label: 'Burgers' },
  { slug: 'pizza', label: 'Pizza' },
  { slug: 'bbq', label: 'BBQ' },
  { slug: 'pasta', label: 'Pasta' },
  { slug: 'noodles', label: 'Noodles' },
  { slug: 'fried-chicken', label: 'Fried chicken' },
  { slug: 'other', label: 'Other' }
];

export const HOODS = [
  { slug: 'downtown', label: 'Downtown' },
  { slug: 'southside', label: 'Southside' },
  { slug: 'north-shore', label: 'North Shore' },
  { slug: 'st-elmo', label: 'St. Elmo' },
  { slug: 'red-bank-hixson', label: 'Red Bank / Hixson' },
  { slug: 'signal-mountain', label: 'Signal Mountain' },
  { slug: 'brainerd-hamilton-place', label: 'Brainerd / Hamilton Place' },
  { slug: 'east-ridge', label: 'East Ridge' }
];

// FIXME: confirm final category weights (they must add up to 1)
export const WEIGHTS = { food: 0.5, service: 0.2, value: 0.2, atmosphere: 0.1 };


// ---------- Small helpers ----------

// Turn a slug into its label: labelFor(CUISINES, 'bbq') -> 'BBQ'
export function labelFor(list, slug) {
  for (const item of list) {
    if (item.slug === slug) return item.label;
  }
  return slug;   // unknown slug: show it as-is rather than crash
}

// The overall score is never typed in by hand. It's always calculated
// from the four category scores, so it can't disagree with the ticket.
export function overallScore(scores) {
  let total = 0;
  for (const category in WEIGHTS) {
    total = total + scores[category] * WEIGHTS[category];
  }
  return Math.round(total * 10) / 10;   // one decimal place: 6.43 -> 6.4
}

// '2026-09-28' -> 'Sep 2026'
// timeZone 'UTC' matters: a bare date like '2026-09-01' is read as midnight UTC,
// which is still Aug 31 in Chattanooga. Without it, some dates show the wrong month.
export function formatMonth(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short', year: 'numeric', timeZone: 'UTC'
  });
}


// ---------- Loading the reviews ----------
//
// LOAD reviews.json
// KEEP only reviews with status "published"
// ADD the calculated overall score to each one
//
// "async" lets us "await" the download instead of freezing the page while it happens.
// In phase 3 the only line that changes is the fetch address: 'data/reviews.json' -> '/api/reviews'.
export async function loadReviews() {
  const response = await fetch('data/reviews.json');
  if (!response.ok) {
    throw new Error('Could not load reviews (HTTP ' + response.status + ')');
  }
  const all = await response.json();

  const published = [];
  for (const review of all) {
    if (review.status === 'published') {
      review.overall = overallScore(review.scores);
      published.push(review);
    }
  }
  return published;
}

// Shown in place of the cards if loading fails (network trouble, a typo in reviews.json).
export function loadErrorMessage() {
  return 'Reviews couldn’t load right now. Try refreshing the page.';
}


// ---------- Building a review card ----------
//
// The card's HTML lives in a <template> tag on the page, not in this file.
// We copy that template and fill in the blanks.
//
// Every blank is filled with textContent, never innerHTML.
// textContent always treats the value as plain text, so if a review ever
// contained something like <script>, it shows up as harmless text instead
// of running. That's the main defense against XSS (cross-site scripting).
export function buildCard(review, template) {
  const card = template.content.firstElementChild.cloneNode(true);
  const link = 'review.html?slug=' + encodeURIComponent(review.slug);

  // the photo: a real <img> if there is one, otherwise the grey placeholder
  const photo = card.querySelector('.photo');
  photo.href = link;
  if (review.photo) {
    const img = document.createElement('img');
    img.src = review.photo;
    img.alt = review.photoAlt || review.name;
    img.loading = 'lazy';   // don't download it until it's about to scroll into view
    photo.textContent = '';
    photo.appendChild(img);
  }

  card.querySelector('.card-kicker').textContent =
    labelFor(CUISINES, review.cuisine) + ' · ' + labelFor(HOODS, review.hood);

  const title = card.querySelector('.card-name');
  title.textContent = review.name;
  title.href = link;

  const score = card.querySelector('.score');
  score.textContent = review.overall.toFixed(1);   // always one decimal: 5 -> "5.0"
  if (review.overall >= 8) score.classList.add('high');   // 8 and up get the red box

  card.querySelector('.review-blurb').textContent = review.verdict;

  // the date line only exists on the All Reviews page's template
  const date = card.querySelector('.card-date time');
  if (date) {
    date.dateTime = review.visitDate;
    date.textContent = formatMonth(review.visitDate);
  }

  return card;
}
