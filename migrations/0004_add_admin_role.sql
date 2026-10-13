-- migrations/0004_add_admin_role.sql
--
-- Adds the 'admin' role: a critic who can also add and remove critics.
--
-- SQLite can't change a CHECK on an existing table, so we rebuild users:
-- make a new table with the new rule, copy the rows over, drop the old one,
-- and give the new one the old name.
-- Done while users is EMPTY. Cloudflare D1 refuses this rebuild once rows
-- in sessions point at users, so it's easy now and painful later.

-- Tells the database: "check foreign keys at the END of this migration,
-- not after every single line." Between steps 3 and 4 there's briefly no
-- table named users, and without this the database would object mid-swap.
PRAGMA defer_foreign_keys = true;

-- 1. The new table: identical to 0001 except the role CHECK
CREATE TABLE users_new (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  -- admin  = critic + can add and remove critics
  -- critic = writes and publishes reviews
  -- demo   = public portfolio login, can look but not save
  role          TEXT NOT NULL DEFAULT 'demo' CHECK (role IN ('admin', 'critic', 'demo')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Copy every row across, naming each column so nothing lands in the wrong place
INSERT INTO users_new (id, name, email, password_hash, role, created_at)
  SELECT id, name, email, password_hash, role, created_at FROM users;

-- 3. Remove the old table
DROP TABLE users;

-- 4. The new table takes over the old name.
--    reviews.author_id and sessions.user_id point at "users" by name,
--    so they now point here.
ALTER TABLE users_new RENAME TO users;