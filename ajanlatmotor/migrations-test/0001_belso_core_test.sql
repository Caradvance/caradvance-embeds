-- TEST DATABASE ONLY (caradvance-offers-test). Never apply to caradvance-belso-db.
-- Recreates the belső core tables with the production schema (read 2026-10-27, empty) and two test logins.
-- The passwords are not stored here, only PBKDF2-SHA256 hashes (100 000 iterations, same as /api/belso).

CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, salt_hex TEXT NOT NULL, hash_hex TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS deals (id INTEGER PRIMARY KEY AUTOINCREMENT, line TEXT NOT NULL, stage TEXT NOT NULL, ch TEXT, name TEXT, phone TEXT, email TEXT, car TEXT, price INTEGER DEFAULT 0, note TEXT, when_text TEXT, assigned_to INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), client_picks_json TEXT, client_responded_at TEXT);
CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT, phone TEXT, email TEXT, country TEXT, assigned_to INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, t TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, assigned_to INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS offer_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL, deal_id INTEGER NOT NULL, client_name TEXT, car TEXT, candidates_json TEXT NOT NULL, selected_json TEXT, responded_at TEXT, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS oauth_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, email TEXT NOT NULL, access_token TEXT, refresh_token TEXT, expires_at TEXT, scope TEXT, connected_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(provider, email));

INSERT OR IGNORE INTO users (email, name, role, salt_hex, hash_hex) VALUES ('teszt.admin@caradvance.hu', 'Teszt Admin', 'admin', '82c90f08cb7dbdcef1365abc7417d92a', '6504585b67af1eb107779a0c132041d61efb1ed4840a225cda136d9ce307411b');
INSERT OR IGNORE INTO users (email, name, role, salt_hex, hash_hex) VALUES ('teszt.ertekesito@caradvance.hu', 'Teszt Értékesítő', 'sales_manager', '82b8e98699def251c63e3cc5cf5004ff', '2caf7d19acbc833fcdc21d496e364ea703d0ebe5bbc4a17e0db9b90eb2b4e607');
