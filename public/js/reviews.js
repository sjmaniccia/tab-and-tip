// reviews.js — the All Reviews page: filters and sorting.
//
// What changed from the first version:
//   Before, the cards were typed into the HTML and this script hid or showed them.
//   Now the cards come from reviews.json. The script filters the DATA first,
//   then draws only the cards that made it through.
//
// ON PAGE LOAD
//   FILL the cuisine and neighborhood dropdowns from the lists in data.js
//   READ ?cuisine= ?hood= ?sort= from the URL (homepage tiles link here with those)
//   LOAD the reviews
//   RUN update
// WHEN any dropdown changes, or Clear is pressed
//   RUN update
// update:
//   KEEP reviews whose cuisine AND neighborhood match
//   SORT them by the chosen order
//   CLEAR the grid and DRAW a card for each one
//   SHOW the count, or the "nothing matches" message
//   COPY the choices into the address bar so the view can be shared

import { CUISINES, HOODS, loadReviews, loadErrorMessage, buildCard } from './data.js';

const form = document.getElementById('filters');
const cuisineSelect = document.getElementById('f-cuisine');
const hoodSelect = document.getElementById('f-hood');
const sortSelect = document.getElementById('f-sort');
const grid = document.getElementById('review-grid');
const countLine = document.getElementById('result-count');
const emptyMessage = document.getElementById('empty');
const cardTemplate = document.getElementById('card-template');

let reviews = [];   // filled once the data loads


// ---------- Dropdowns ----------
// Built from the same lists as the homepage tiles, so the two can never disagree.
function fillSelect(select, list) {
  for (const item of list) {
    const option = document.createElement('option');
    option.value = item.slug;
    option.textContent = item.label;
    select.appendChild(option);
  }
}

// Set a dropdown from the URL, but only if that option actually exists.
// (Someone could type ?cuisine=anything into the address bar.)
function setIfValid(select, value) {
  if (!value) return;
  for (const option of select.options) {
    if (option.value === value) {
      select.value = value;
      return;
    }
  }
}


// ---------- Sorting rules ----------
// Return a negative number if a goes first, positive if b goes first, 0 to leave them.
function compareReviews(a, b, sortBy) {
  if (sortBy === 'highest') return b.overall - a.overall;
  if (sortBy === 'lowest') return a.overall - b.overall;
  if (sortBy === 'name') return a.name.localeCompare(b.name);
  return b.visitDate.localeCompare(a.visitDate);   // 'newest'
}


// ---------- The main function ----------
function update() {
  const cuisine = cuisineSelect.value;
  const hood = hoodSelect.value;
  const sortBy = sortSelect.value;

  // 1. Filter the data
  const matches = [];
  for (const review of reviews) {
    const cuisineMatches = (cuisine === 'all' || review.cuisine === cuisine);
    const hoodMatches = (hood === 'all' || review.hood === hood);
    if (cuisineMatches && hoodMatches) {
      matches.push(review);
    }
  }

  // 2. Sort what's left
  matches.sort(function (a, b) {
    return compareReviews(a, b, sortBy);
  });

  // 3. Redraw: empty the grid, then add one card per match
  grid.replaceChildren();
  for (const review of matches) {
    grid.appendChild(buildCard(review, cardTemplate));
  }

  // 4. Count line and empty message
  if (cuisine === 'all' && hood === 'all') {
    countLine.textContent = 'Showing all ' + matches.length + ' reviews';
  } else {
    countLine.textContent = 'Showing ' + matches.length + ' of ' + reviews.length + ' reviews';
  }
  emptyMessage.hidden = (matches.length !== 0);

  // 5. Keep the address bar in sync (no page reload)
  const params = new URLSearchParams();
  if (cuisine !== 'all') params.set('cuisine', cuisine);
  if (hood !== 'all') params.set('hood', hood);
  if (sortBy !== 'newest') params.set('sort', sortBy);
  const query = params.toString();
  history.replaceState(null, '', query ? '?' + query : location.pathname);
}


// ---------- Start up ----------
async function start() {
  fillSelect(cuisineSelect, CUISINES);
  fillSelect(hoodSelect, HOODS);

  const startParams = new URLSearchParams(location.search);
  setIfValid(cuisineSelect, startParams.get('cuisine'));
  setIfValid(hoodSelect, startParams.get('hood'));
  setIfValid(sortSelect, startParams.get('sort'));

  try {
    reviews = await loadReviews();
  } catch (error) {
    console.error(error);
    countLine.textContent = loadErrorMessage();
    return;
  }

  form.addEventListener('change', update);
  // Clear is a type="reset" button. The reset happens just AFTER this event fires,
  // so wait one tick (setTimeout 0) before redrawing.
  form.addEventListener('reset', function () {
    setTimeout(update, 0);
  });

  update();
}

start();
