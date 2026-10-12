-- migrations/0003_add_sessions_and_login_attempts.sql
--
-- Adds what login needs:
--   sessions        = who is logged in right now (the wristband list)
--   login_attempts  = recent login tries, so we can slow down password guessing


-- ---------------------------------------------------------------------------
-- SESSIONS
-- ---------------------------------------------------------------------------
-- One row per logged-in browser. The browser holds the real token in a cookie.
-- We store only a HASH of the token, so if this table ever leaked,
-- nobody could copy a token out of it and log in as a critic.
CREATE TABLE sessions (
  -- The hashed token. PRIMARY KEY means it must be unique, and it's
  -- automatically indexed, so "find this token" is fast on every request.
  token_hash TEXT PRIMARY KEY,

  -- Whose wristband this is. Must point at a real user.
  -- ON DELETE CASCADE: if a user is deleted, their sessions go with them,
  -- so a deleted account can't stay logged in.
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- When they logged in
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- When the wristband stops working. Every request checks this,
  -- so a stolen or forgotten session dies on its own.
  expires_at TEXT NOT NULL
);

-- Lets us quickly find every session for one user,
-- e.g. a "log me out everywhere" button later.
CREATE INDEX idx_sessions_user ON sessions (user_id);

-- ---------------------------------------------------------------------------
-- LOGIN ATTEMPTS
-- ---------------------------------------------------------------------------
-- One row per FAILED login. Before checking a password, the login code
-- counts recent rows. Too many failures means we refuse to even check,
-- which makes guessing passwords painfully slow.
CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY,

  -- The email that was typed in, saved in lowercase.
  -- No REFERENCES users(id) on purpose: attackers often type emails
  -- that don't exist, and we still want to count those tries.
  email TEXT NOT NULL,

  -- The visitor's IP address (Cloudflare tells us this).
  -- This catches one person trying lots of DIFFERENT emails.
  ip TEXT NOT NULL,

  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The login code asks "how many failures for THIS email since 15 minutes ago?"
-- and "how many failures from THIS IP since 15 minutes ago?"
-- These two indexes make both questions fast.
CREATE INDEX idx_login_attempts_email_time ON login_attempts (email, attempted_at);
CREATE INDEX idx_login_attempts_ip_time ON login_attempts (ip, attempted_at);