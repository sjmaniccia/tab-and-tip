// functions/api/reviews/index.js
//
// GET /api/reviews
// Sends back every published review, newest first, as JSON.
//
// This file runs on Cloudflare's servers, never in the visitor's browser.
// Its location in the functions/ folder is what makes it answer at /api/reviews.


// ---------------------------------------------------------------------------
// 1. WHICH COLUMNS THE PUBLIC MAY SEE
// ---------------------------------------------------------------------------
// An allowlist: only the columns named here can ever be sent to a visitor.
// author_id, created_at and updated_at are left out on purpose.
// (SELECT * would send every column, including private ones added later.)
//
// The backticks ` ` make a string that can run over several lines.
// const = a value that never changes. ALL_CAPS = a setting-style constant.
// Exported so the single-review endpoint ([slug.js]) can reuse it, so the allowlist lives in one place.
export const PUBLIC_COLUMNS = `id, slug, name, cuisine, hood, score_food, score_service, score_value,
                        score_atmosphere, verdict, note_food, note_service, note_value, note_atmosphere,
                        website_url, menu_url, map_url, photo, photo_alt, visits, visit_date,
                        paid_cents, status`;


// ---------------------------------------------------------------------------
// 2. THE TRANSLATOR: database row -> website review
// ---------------------------------------------------------------------------
// The database stores data the way that's best for STORAGE:
//   flat columns, scores in tenths (75), money in cents (6450), snake_case names.
// The website wants data the way that's best for DISPLAY:
//   grouped fields, normal scores (7.5), dollars (64.5), camelCase names.
//
// This function takes ONE row and returns it in the same shape as the old
// reviews.json, so the front-end pages barely have to change.
//
// "export" puts it on the menu so other files can import it.
// The single-review endpoint (step 4) reuses it, so the translation lives in one place.
export function formatReview(row) {
  return {
    // Copied straight across, no changes needed
    id: row.id,
    slug: row.slug,
    name: row.name,
    cuisine: row.cuisine,
    hood: row.hood,

    // The restaurant's ticket (or score): four flat columns grouped into one object.
    // Scores are stored in tenths, so divide by 10: 95 -> 9.5, 80 -> 8
    scores: {
      food: row.score_food / 10,
      service: row.score_service / 10,
      value: row.score_value / 10,
      atmosphere: row.score_atmosphere / 10,
    },
    
    // The overall verdict, a text file that summarizes the restaurantexperience in a few words.
    verdict: row.verdict,

    // The back of the check (detailed review): one short note per category, grouped
    notes: {
      food: row.note_food,
      service: row.note_service,
      value: row.note_value,
      atmosphere: row.note_atmosphere,
    },

    // Website, menu and map, grouped. The "_url" is dropped because
    // being inside "links" already says what they are.
    links: {
      website: row.website_url,
      menu: row.menu_url,
      map: row.map_url,
    },

    // Renamed from SQL style (snake_case) to JavaScript style (camelCase)
    photo: row.photo,
    photoAlt: row.photo_alt,
    visits: row.visits,
    visitDate: row.visit_date,

    // Stored in cents so the math is always exact. Divide by 100 for dollars: 6450 -> 64.5
    paid: row.paid_cents / 100,

    status: row.status,
  };
}


// ---------------------------------------------------------------------------
// 3. THE HANDLER: what runs when someone visits /api/reviews
// ---------------------------------------------------------------------------
// Cloudflare looks for an exported function with this exact name.
//   onRequestGet = run this when someone READS the URL (a GET request).
//   (Other methods, like POST, get an automatic "405 Method Not Allowed".)
//
// "async" because it waits on the database (see "await" below).
// "context" is everything Cloudflare hands us about this request:
//   context.request = what was asked for
//   context.env     = our bindings, including context.env.DB (the database)
export async function onRequestGet(context) {

  // try { } = attempt everything in here. If ANY line fails,
  // skip straight to catch { } below instead of crashing.
  try {

    // --- 3a. Build the question for the database ------------------------------
    // ${PUBLIC_COLUMNS} drops the column list into the query.
    // This is SAFE only because PUBLIC_COLUMNS is our own constant.
    // Visitor input must NEVER go in ${ } or be glued into SQL;
    // it always goes through a ? placeholder (see step 4's file).
    const sql = `SELECT ${PUBLIC_COLUMNS} FROM reviews
                 WHERE status = 'published' ORDER BY visit_date DESC`;
    //            ^ drafts are filtered out here       ^ newest first

    // --- 3b. Ask the database, and wait for the answer -------------------------
    // prepare() readies the query, all() runs it and returns every matching row.
    // await = pause THIS request until the rows arrive
    //         (the server keeps handling other visitors meanwhile).
    // { results } pulls just the rows out of the answer object.
    const { results } = await context.env.DB.prepare(sql).all();

    // --- 3c. Translate every row -------------------------------------------------
    // Start with an empty list, run each raw row through formatReview,
    // and add the translated review to the list.
    const reviews = [];
    for (const row of results) {
      reviews.push(formatReview(row));
    }

    // --- 3d. Send the answer back -----------------------------------------------
    // Response.json() turns the list into JSON text and sends it (status 200 = OK).
    // Cache-Control lets browsers and Cloudflare reuse this answer for 60 seconds,
    // so a busy minute costs one database query instead of hundreds.
    // Trade-off: a newly published review can take up to a minute to appear.
    return Response.json(reviews, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });

  } catch (error) {
    // --- 3e. Something failed -----------------------------------------------------
    // The real error goes to the server log: only WE can see it
    // (the Wrangler terminal now, Cloudflare's logs once live).
    console.error('GET /api/reviews failed:', error);

    // The visitor gets a plain, vague message with no internal details.
    // Status 500 = "something went wrong on the server."
    return Response.json({ error: 'Could not load reviews' }, { status: 500 });
  }
}