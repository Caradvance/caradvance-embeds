-- Caradvance Offer Engine: initial schema

CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT NOT NULL,                 -- email | manual
  message_id TEXT UNIQUE,               -- idempotency for inbound mail
  from_email TEXT,
  subject TEXT,
  body_text TEXT,
  requirements_json TEXT,               -- extracted (and admin-edited) requirements
  extraction_meta_json TEXT,            -- engine, confidence, missing fields, flags
  clarify_draft TEXT,
  search_note TEXT
);
CREATE INDEX idx_requests_status ON requests(status);

CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id),
  slot INTEGER,                         -- 1..3 when selected, NULL otherwise
  pool TEXT NOT NULL,                   -- top | runner | declined | rejected
  ad_id TEXT NOT NULL,
  source TEXT NOT NULL,                 -- mock | searchapi | apify | manual | extension
  listing_json TEXT NOT NULL,
  score REAL,
  score_detail_json TEXT,
  rationale TEXT,
  positioning TEXT,
  locked INTEGER NOT NULL DEFAULT 0,
  distance_km REAL,
  distance_method TEXT,
  overrides_json TEXT,                  -- admin overrides: line amounts, logistics mode, env class
  descriptions_json TEXT,
  added_by TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(request_id, ad_id)
);
CREATE INDEX idx_candidates_request ON candidates(request_id);

CREATE TABLE offers (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id),
  token TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL,
  status TEXT NOT NULL,                 -- PUBLISHED | VIEWED | CHOSEN | NONE_FIT | EXPIRED
  published_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,          -- frozen listing, costs and texts at publish time
  rate_version INTEGER,
  first_viewed_at TEXT,
  chosen_candidate_id TEXT,
  chosen_at TEXT,
  choice_json TEXT
);

CREATE TABLE offer_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data_json TEXT,
  at TEXT NOT NULL
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT,
  actor TEXT NOT NULL,
  type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  data_json TEXT,
  at TEXT NOT NULL
);
CREATE INDEX idx_events_request ON events(request_id);

CREATE TABLE rate_config (
  version INTEGER PRIMARY KEY AUTOINCREMENT,
  config_json TEXT NOT NULL,
  author TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE email_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  direction TEXT NOT NULL,              -- in | out
  to_addr TEXT,
  subject TEXT,
  body TEXT,
  status TEXT NOT NULL,                 -- sent | logged | failed
  at TEXT NOT NULL
);

CREATE TABLE ext_tokens (
  id TEXT PRIMARY KEY,
  user TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);
