// home.js — fills in the homepage from the review data.
//
// LOAD the published reviews
// BUILD the cuisine tiles and neighborhood tiles, each with its review count
// FILL IN the running totals on the hero ticket
// SHOW the three newest reviews at the bottom

import { CUISINES, HOODS, loadReviews, loadErrorMessage, buildCard } from './data.js';

const cuisineGrid = document.getElementById('cuisine-tiles');
const hoodGrid = document.getElementById('hood-tiles');
const recentGrid = document.getElementById('recent-grid');
const tileTemplate = document.getElementById('tile-template');
const cardTemplate = document.getElementById('card-template');


// "1 review" but "2 reviews" (and "0 reviews")
function reviewCount(n) {
  return n + (n === 1 ? ' review' : ' reviews');
}

// Count how many reviews have each value of a field.
// countBy(reviews, 'cuisine') -> { tacos: 2, pizza: 1, ... }
function countBy(reviews, field) {
  const counts = {};
  for (const review of reviews) {
    const key = review[field];
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

// One tile per item in the list, linking to the reviews page pre-filtered.
// param is 'cuisine' or 'hood'; extraClass makes the cuisine tiles light-on-dark.
function buildTiles(grid, list, counts, param, extraClass) {
  for (const item of list) {
    const tile = tileTemplate.content.firstElementChild.cloneNode(true);
    const link = tile.querySelector('.tile');
    link.href = 'reviews.html?' + param + '=' + encodeURIComponent(item.slug);
    if (extraClass) link.classList.add(extraClass);
    tile.querySelector('.tile-name').textContent = item.label;
    tile.querySelector('.tile-count').textContent = reviewCount(counts[item.slug] || 0);
    grid.appendChild(tile);
  }
}


async function start() {
  let reviews;
  try {
    reviews = await loadReviews();
  } catch (error) {
    console.error(error);
    const message = document.createElement('p');
    message.className = 'empty';
    message.textContent = loadErrorMessage();
    recentGrid.before(message);
    // still draw the tiles (with no counts) so the page is usable
    buildTiles(cuisineGrid, CUISINES, {}, 'cuisine', 'tile-dark');
    buildTiles(hoodGrid, HOODS, {}, 'hood', null);
    return;
  }

  // 1. Tiles
  buildTiles(cuisineGrid, CUISINES, countBy(reviews, 'cuisine'), 'cuisine', 'tile-dark');
  buildTiles(hoodGrid, HOODS, countBy(reviews, 'hood'), 'hood', null);

  // 2. Hero ticket totals
  let meals = 0;
  let secondVisits = 0;
  for (const review of reviews) {
    meals = meals + review.visits;
    if (review.visits >= 2) secondVisits = secondVisits + 1;
  }
  document.getElementById('total-restaurants').textContent = reviews.length;
  document.getElementById('total-meals').textContent = meals;
  document.getElementById('total-second').textContent = secondVisits;

  // 3. Three newest reviews.
  //    Dates are YYYY-MM-DD, so comparing them as text sorts them by date.
  const newest = reviews.slice().sort(function (a, b) {
    return b.visitDate.localeCompare(a.visitDate);
  });
  for (const review of newest.slice(0, 3)) {
    recentGrid.appendChild(buildCard(review, cardTemplate));
  }
}

start();
