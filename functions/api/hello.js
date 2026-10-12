// functions/api/hello.js
// Runs on Cloudflare's servers, never in the visitor's browser.
// The file's location makes it the URL /api/hello

export function onRequestGet(context) {
  return Response.json({
    message: 'Hello from the Tab & Tip API',
    time: new Date().toISOString()
  });
}