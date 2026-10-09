// reviews.js — filters and sorting for the All Reviews page
//
// The big idea:
//   1. Every review card stores its info in data- attributes (cuisine, hood, score, date, name).
//   2. When a dropdown changes, loop over every card and hide the ones that don't match.
//   3. Put the cards in the chosen order and re-add them to the grid in that order.
//   4. Update the "Showing X reviews" line.
//
// Pseudocode:
//   ON PAGE LOAD
//     READ ?cuisine= and ?hood= from the URL (homepage tiles link here with those)
//     SET the dropdowns to match
//     RUN update
//   WHEN any dropdown changes
//     RUN update
//   update:
//     FOR EACH card
//       IF cuisine matches AND neighborhood matches THEN show it ELSE hide it
//     SORT cards by the chosen order
//     MOVE them into the grid in that order
//     SHOW the count, or the "nothing matches" message


// ---------- Grab the pieces of the page we need ----------
const form = document.getElementById('filters');
const cuisineSelect = document.getElementById('f-cuisine');
const hoodSelect = document.getElementById('f-hood');
const sortSelect = document.getElementById('f-sort');
const grid = document.getElementById('review-grid');
const countLine = document.getElementById('result-count');
const emptyMessage = document.getElementById('empty');

// querySelectorAll gives a NodeList; Array.from turns it into a real array so we can sort it.
const cards = Array.from(grid.querySelectorAll('.review-card'));


// ---------- Sorting rules ----------
// A compare function gets two cards (a, b) and returns:
//   a negative number -> a goes first
//   a positive number -> b goes first
//   0                 -> leave them as they are
function compareCards(a, b, sortBy) {
  if (sortBy === 'highest') {
    return Number(b.dataset.score) - Number(a.dataset.score);
  }
  if (sortBy === 'lowest') {
    return Number(a.dataset.score) - Number(b.dataset.score);
  }
  if (sortBy === 'name') {
    return a.dataset.name.localeCompare(b.dataset.name);
  }
  // 'newest': dates are written YYYY-MM-DD, so comparing them as text puts them in date order
  return b.dataset.date.localeCompare(a.dataset.date);
}


// ---------- The main function: filter, sort, redraw ----------
function update() {
  const cuisine = cuisineSelect.value;
  const hood = hoodSelect.value;
  const sortBy = sortSelect.value;

  // 1. Filter: show or hide each card
  let shown = 0;
  for (const card of cards) {
    const cuisineMatches = (cuisine === 'all' || card.dataset.cuisine === cuisine);
    const hoodMatches = (hood === 'all' || card.dataset.hood === hood);

    if (cuisineMatches && hoodMatches) {
      card.hidden = false;
      shown = shown + 1;
    } else {
      card.hidden = true;
    }
  }

  // 2. Sort: copy the array so the original order is never lost, then sort the copy
  const sorted = cards.slice();
  sorted.sort(function (a, b) {
    return compareCards(a, b, sortBy);
  });

  // 3. Redraw: appendChild on an element that's already in the grid MOVES it to the end,
  //    so appending in sorted order rearranges the grid without copying anything.
  for (const card of sorted) {
    grid.appendChild(card);
  }

  // 4. Count line and empty message
  if (cuisine === 'all' && hood === 'all') {
    countLine.textContent = 'Showing all ' + shown + ' reviews';
  } else {
    countLine.textContent = 'Showing ' + shown + ' of ' + cards.length + ' reviews';
  }
  emptyMessage.hidden = (shown !== 0);

  // 5. Keep the address bar in sync so a filtered view can be bookmarked or shared.
  //    replaceState changes the URL without reloading the page.
  const params = new URLSearchParams();
  if (cuisine !== 'all') params.set('cuisine', cuisine);
  if (hood !== 'all') params.set('hood', hood);
  if (sortBy !== 'newest') params.set('sort', sortBy);
  const query = params.toString();
  history.replaceState(null, '', query ? '?' + query : location.pathname);
}


// ---------- Set a dropdown from the URL, but only if that option actually exists ----------
function setIfValid(select, value) {
  if (!value) return;
  for (const option of select.options) {
    if (option.value === value) {
      select.value = value;
      return;
    }
  }
}


// ---------- Wire it all up ----------
// One listener on the whole form catches a change from any of the three dropdowns.
form.addEventListener('change', update);

// The Clear button is type="reset", which puts every dropdown back to its first option.
// The reset happens right after this event, so wait one tick (setTimeout 0) before updating.
form.addEventListener('reset', function () {
  setTimeout(update, 0);
});

// On page load: apply any filters from the URL (e.g. reviews.html?cuisine=tacos), then draw.
const startParams = new URLSearchParams(location.search);
setIfValid(cuisineSelect, startParams.get('cuisine'));
setIfValid(hoodSelect, startParams.get('hood'));
setIfValid(sortSelect, startParams.get('sort'));
update();
