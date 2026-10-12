// functions/api/reviews/[slug].js
//
// GET /api/reviews/<slug>
// Sends back ONE published review, found by its slug.
// The [slug] in this file's name means that part of the URL can be anything;
// Cloudflare hands us whatever it was as context.params.slug.

// Take the shared allowlist and translator off index.js's menu,
// so both endpoints use the exact same rules.
import { PUBLIC_COLUMNS, formatReview } from './index.js';

export async function onRequestGet(context) {
    try {
        // The piece of the URL in the [slug] spot.
        // For /api/reviews/sample-restaurant-c this is 'sample-restaurant-c'.
        // This comes from the VISITOR, so it is never trusted.
        const slug = context.params.slug;

        // The question, with a ? where the visitor's slug goes.
        // NEVER put slug inside ${ } here. That would let visitors rewrite the query.
        // ${PUBLIC_COLUMNS} is fine: it's our own constant.
        const sql = `SELECT ${PUBLIC_COLUMNS} FROM reviews
                 WHERE slug = ? AND status = 'published'`;

        // .bind(slug) hands the slug to the database SEPARATELY from the SQL,
        // so it can only ever be treated as a value to match, never as SQL code.
        // .first() returns just one row, or null if nothing matched.
        const row = await context.env.DB.prepare(sql).bind(slug).first();

        // Nothing matched: no review with that slug, or it's still a draft.
        // Same answer either way, so we never confirm that a draft exists.
        // Early return: stop here so formatReview never sees null.
        if (row === null) {
            return Response.json({ error: 'Review not found' }, { status: 404 });
        }

        // Translate with the same function the list endpoint uses, and send it.
        // Cache for 60 seconds, same trade-off as the list.
        return Response.json(formatReview(row), {
            headers: { 'Cache-Control': 'public, max-age=60' },
        });

    }
     catch (error) {
        // Real details to our log, vague message to the visitor.
        console.error('GET /api/reviews/:slug failed:', error);
        return Response.json({ error: 'Could not load review' }, { status: 500 });
    }
}