// lib/password.js
//
// Turns passwords into hashes, and (next step) checks a password against a hash.
// Used by the login endpoint AND the create-account script, so the rules
// for hashing live in exactly one place.
//
// crypto.subtle is the Web Crypto API. It's built into Cloudflare's servers
// AND into Node, so this same file works in both places. No npm package needed.


// ---------------------------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------------------------
// How many times PBKDF2 runs the blender. More = slower for attackers to guess.
// 600,000 is OWASP's recommendation for PBKDF2 with SHA-256.
// Why PBKDF2 and not Argon2id: Argon2id isn't available on Cloudflare,
// and scrypt needs more memory than a free Cloudflare function gets.
// FIXME: time a real login on the live site in step 9. The free plan limits
// CPU time per request, so this may need to come down (and be written up).
const ITERATIONS = 600000;

const SALT_BYTES = 16;   // 16 random bytes of salt, unique to each password
const HASH_BITS = 256;   // how long the finished hash is (256 bits = 32 bytes)


// ---------------------------------------------------------------------------
// HELPER: bytes -> text
// ---------------------------------------------------------------------------
// Crypto works with raw bytes (numbers 0-255). The database wants text.
// Hex writes each byte as 2 characters, 0-9 and a-f: 255 -> "ff", 7 -> "07".
// padStart(2, '0') adds the leading zero so every byte is exactly 2 characters.
function toHex(bytes) {
  let hex = '';
  for (const byte of bytes) {
    hex = hex + byte.toString(16).padStart(2, '0');
  }
  return hex;
}


// ---------------------------------------------------------------------------
// HELPER: the blender itself
// ---------------------------------------------------------------------------
// Takes a password + salt, runs PBKDF2 "iterations" times, returns the hash bytes.
// Not exported: other files use hashPassword (below) instead.
async function pbkdf2(password, salt, iterations) {
  // 1. Turn the password text into bytes, and hand it to Web Crypto as a "key"
  const key = await crypto.subtle.importKey(
    'raw',                                  // it's plain bytes
    new TextEncoder().encode(password),     // the password, as bytes
    'PBKDF2',                               // what we'll use it for
    false,                                  // can't be exported back out
    ['deriveBits']                          // the only thing it's allowed to do
  );

  // 2. Run the blender
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iterations },
    key,
    HASH_BITS
  );

  // 3. deriveBits hands back a raw buffer. Uint8Array lets us loop over its bytes.
  return new Uint8Array(bits);
}


// ---------------------------------------------------------------------------
// MAKE A HASH (used when creating an account or changing a password)
// ---------------------------------------------------------------------------
// hashPassword('hunter2') ->
//   'pbkdf2$100000$<salt in hex>$<hash in hex>'
//
// Everything needed to CHECK the password later is saved in that one string,
// separated by $ signs: the method, the iteration count, the salt, the hash.
// Saving the iteration count means we can raise it someday without breaking
// passwords that were hashed with the old number.
export async function hashPassword(password) {
  // A brand-new random salt every time, so two critics with the same
  // password still end up with completely different hashes
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));

  const hash = await pbkdf2(password, salt, ITERATIONS);

  return 'pbkdf2$' + ITERATIONS + '$' + toHex(salt) + '$' + toHex(hash);
}

// ---------------------------------------------------------------------------
// HELPER: text -> bytes (the reverse of toHex)
// ---------------------------------------------------------------------------
// "ff07" -> [255, 7]. Reads the hex 2 characters at a time.
//
// This is the "classic" for loop, used when you need the position number (i):
//   let i = 0           start at position 0
//   i < bytes.length    keep going while there are positions left
//   i++                 add 1 to i after each lap
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);   // 2 hex characters = 1 byte
  for (let i = 0; i < bytes.length; i++) {
    // slice grabs characters i*2 up to i*2+2, e.g. "ff"
    // parseInt(..., 16) reads it as base-16: "ff" -> 255
    bytes[i] = parseInt(hex.slice(i * 2, (i * 2) + 2), 16);
  }
  return bytes;
}


// ---------------------------------------------------------------------------
// HELPER: compare two hashes WITHOUT leaking timing
// ---------------------------------------------------------------------------
// The obvious way (stop at the first byte that doesn't match) is fast when
// the very first byte is wrong and slower when many bytes match. An attacker
// measuring response times very carefully could learn how close they are.
//
// So we ALWAYS check every byte, then decide at the end:
//   a[i] ^ b[i]   ^ (XOR) gives 0 if the two bytes are equal, non-zero if not
//   difference |  | (OR) "remembers" any non-zero result from any lap
// If even one byte differed, difference ends up non-zero.
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) {
    difference = difference | (a[i] ^ b[i]);
  }
  return difference === 0;
}


// ---------------------------------------------------------------------------
// CHECK A PASSWORD (used at login)
// ---------------------------------------------------------------------------
// verifyPassword('hunter2', 'pbkdf2$600000$<salt>$<hash>') -> true or false
export async function verifyPassword(password, stored) {
  // 'pbkdf2$600000$abc...$def...'.split('$')
  //   -> ['pbkdf2', '600000', 'abc...', 'def...']
  const parts = stored.split('$');

  // Not in the format we expect? Treat it as wrong rather than crash.
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  // Use the iteration count SAVED WITH THIS HASH, not today's ITERATIONS
  // setting. That's what lets us change ITERATIONS later without
  // breaking anyone's existing password.
  const iterations = Number(parts[1]);   // the text '600000' -> the number 600000
  const salt = fromHex(parts[2]);
  const expected = fromHex(parts[3]);

  // Re-blend the typed password with the same salt and iterations...
  const actual = await pbkdf2(password, salt, iterations);

  // ...and compare, the safe way
  return sameBytes(actual, expected);
}