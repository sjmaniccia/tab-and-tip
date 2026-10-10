-- The critics who can log in to the portal
CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'critic' CHECK (role IN ('critic', 'demo')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);


-- One row per review
CREATE TABLE reviews (
  id               INTEGER PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  cuisine          TEXT NOT NULL,
  hood             TEXT NOT NULL,

  -- scores are stored in tenths: 75 means 7.5
  score_food       INTEGER NOT NULL CHECK (score_food BETWEEN 10 AND 100),
  score_service    INTEGER NOT NULL CHECK (score_service BETWEEN 10 AND 100),
  score_value      INTEGER NOT NULL CHECK (score_value BETWEEN 10 AND 100),
  score_atmosphere INTEGER NOT NULL CHECK (score_atmosphere BETWEEN 10 AND 100),

  verdict          TEXT NOT NULL DEFAULT '',
  note_food        TEXT NOT NULL DEFAULT '',
  note_service     TEXT NOT NULL DEFAULT '',
  note_value       TEXT NOT NULL DEFAULT '',
  note_atmosphere  TEXT NOT NULL DEFAULT '',

  website_url      TEXT NOT NULL DEFAULT '',
  menu_url         TEXT NOT NULL DEFAULT '',
  map_url          TEXT NOT NULL DEFAULT '',
  photo            TEXT NOT NULL DEFAULT '',
  photo_alt        TEXT NOT NULL DEFAULT '',

  visits           INTEGER NOT NULL DEFAULT 1 CHECK (visits >= 1),
  paid_cents       INTEGER NOT NULL DEFAULT 0 CHECK (paid_cents >= 0),
  visit_date       TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id        INTEGER REFERENCES users(id),
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

