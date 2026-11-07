-- StoryWorld dots 자산 이벤트 서버 D1 스키마
CREATE TABLE IF NOT EXISTS subscriptions(
  id TEXT PRIMARY KEY, principal TEXT NOT NULL, name TEXT NOT NULL, args TEXT NOT NULL, url TEXT NOT NULL,
  secret TEXT NOT NULL, prev_secret TEXT, prev_until INTEGER, expires_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS verified(principal TEXT NOT NULL, url TEXT NOT NULL, verified_at INTEGER NOT NULL, PRIMARY KEY(principal,url));
CREATE TABLE IF NOT EXISTS requests(
  asset_id TEXT PRIMARY KEY, category TEXT NOT NULL, name TEXT NOT NULL, spec TEXT NOT NULL, brief TEXT, prompt TEXT, avoid TEXT,
  status TEXT NOT NULL, rev INTEGER NOT NULL, created_at INTEGER NOT NULL, submitted_at INTEGER);
CREATE TABLE IF NOT EXISTS submissions(
  asset_id TEXT NOT NULL, rev INTEGER NOT NULL, kv_key TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, notes TEXT, at INTEGER NOT NULL, fetched INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(asset_id,rev));
CREATE TABLE IF NOT EXISTS deliveries(
  event_id TEXT NOT NULL, sub_id TEXT NOT NULL, body TEXT NOT NULL, attempts INTEGER NOT NULL, status TEXT NOT NULL, next_at INTEGER NOT NULL, last_status INTEGER,
  PRIMARY KEY(event_id,sub_id));
