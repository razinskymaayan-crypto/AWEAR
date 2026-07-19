-- Postgres schema for AWEAR — apply once via Supabase SQL Editor.
-- Converts the SQLite init_db() schema to Postgres dialect:
--   INTEGER PRIMARY KEY AUTOINCREMENT -> BIGSERIAL PRIMARY KEY
--   datetime('now')  -> '' (app always sets created_at explicitly)
--   date('now')      -> CURRENT_DATE
--   REAL (for epoch) -> DOUBLE PRECISION

-- After running this file in Supabase, set DATABASE_URL on Render to
-- postgresql://postgres:[password]@[host]:[port]/postgres
-- and the app will connect automatically on next deploy.

CREATE TABLE IF NOT EXISTS post_likes (
    post_id    TEXT NOT NULL,
    user_key   TEXT NOT NULL,
    created_at TEXT DEFAULT '',
    PRIMARY KEY (post_id, user_key)
);

CREATE TABLE IF NOT EXISTS follows (
    follower_key      TEXT NOT NULL,
    followed_user_id  TEXT NOT NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_key, followed_user_id)
);

CREATE TABLE IF NOT EXISTS saves (
    post_id    TEXT NOT NULL,
    user_key   TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_key)
);

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name  TEXT DEFAULT '',
    bio           TEXT DEFAULT '',
    avatar_url    TEXT DEFAULT '',
    created_at    DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    created_at DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS challenge_completions (
    id           BIGSERIAL PRIMARY KEY,
    user_key     TEXT    NOT NULL,
    challenge_id TEXT    NOT NULL,
    date         TEXT    NOT NULL DEFAULT CURRENT_DATE::TEXT,
    points       INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    DEFAULT ''
);

CREATE TABLE IF NOT EXISTS wardrobe_wears (
    id         BIGSERIAL PRIMARY KEY,
    user_key   TEXT NOT NULL,
    item_id    TEXT NOT NULL,
    worn_date  TEXT NOT NULL,
    created_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS stylist_bookings (
    id           BIGSERIAL PRIMARY KEY,
    user_key     TEXT NOT NULL,
    stylist_id   TEXT NOT NULL,
    stylist_name TEXT NOT NULL,
    session_type TEXT NOT NULL,
    slot_label   TEXT NOT NULL,
    booked_at    TEXT DEFAULT '',
    status       TEXT DEFAULT 'confirmed'
);

CREATE TABLE IF NOT EXISTS wishlist (
    id         BIGSERIAL PRIMARY KEY,
    user_key   TEXT NOT NULL,
    item_id    TEXT NOT NULL,
    item_type  TEXT NOT NULL DEFAULT 'marketplace',
    item_data  TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_key, item_id)
);

CREATE TABLE IF NOT EXISTS wear_log (
    id             BIGSERIAL PRIMARY KEY,
    user_key       TEXT NOT NULL,
    item_id        TEXT NOT NULL,
    item_name      TEXT,
    worn_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    style_tags     TEXT,
    color_primary  TEXT,
    occasion       TEXT,
    material_guess TEXT
);

CREATE TABLE IF NOT EXISTS season_summaries (
    id           BIGSERIAL PRIMARY KEY,
    user_key     TEXT NOT NULL,
    season       TEXT NOT NULL,
    year         INTEGER NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    summary_json TEXT NOT NULL,
    UNIQUE(user_key, season, year)
);

CREATE TABLE IF NOT EXISTS orders (
    id            TEXT PRIMARY KEY,
    user_key      TEXT NOT NULL,
    post_id       TEXT DEFAULT '',
    product_id    TEXT DEFAULT '',
    product_name  TEXT NOT NULL,
    amount_usd    DOUBLE PRECISION DEFAULT 0,
    status        TEXT DEFAULT 'completed',
    influencer_id TEXT DEFAULT '',
    client_ref    TEXT DEFAULT '',
    kind          TEXT DEFAULT 'retail',
    seller_key    TEXT DEFAULT '',
    commission_usd DOUBLE PRECISION DEFAULT 0,
    created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_userkey_ref     ON orders (user_key, client_ref);
CREATE INDEX IF NOT EXISTS idx_orders_userkey_created ON orders (user_key, created_at);

CREATE TABLE IF NOT EXISTS credits (
    id         TEXT PRIMARY KEY,
    user_key   TEXT NOT NULL,
    order_id   TEXT NOT NULL,
    item_name  TEXT DEFAULT '',
    amount_usd DOUBLE PRECISION DEFAULT 0,
    type       TEXT DEFAULT 'creator',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dm_messages (
    id         BIGSERIAL PRIMARY KEY,
    owner_key  TEXT NOT NULL,
    peer_id    TEXT NOT NULL,
    direction  TEXT NOT NULL,
    text       TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_dm_owner_peer_created ON dm_messages (owner_key, peer_id, created_at);

CREATE TABLE IF NOT EXISTS daily_logs (
    id         BIGSERIAL PRIMARY KEY,
    user_key   TEXT NOT NULL,
    log_date   TEXT NOT NULL,
    items_json TEXT NOT NULL DEFAULT '[]',
    note       TEXT DEFAULT '',
    is_private INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    UNIQUE(user_key, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs (user_key, log_date);

CREATE TABLE IF NOT EXISTS stories (
    id         BIGSERIAL PRIMARY KEY,
    user_key   TEXT NOT NULL,
    image_url  TEXT NOT NULL,
    caption    TEXT DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stories_created ON stories (created_at);

CREATE TABLE IF NOT EXISTS intel_insights (
    id          TEXT PRIMARY KEY,
    topic       TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_url  TEXT DEFAULT '',
    title       TEXT NOT NULL,
    summary     TEXT NOT NULL,
    evidence    TEXT DEFAULT '',
    loop_stage  TEXT DEFAULT '',
    confidence  INTEGER DEFAULT 3,
    impact      INTEGER DEFAULT 3,
    effort      INTEGER DEFAULT 3,
    status      TEXT DEFAULT 'new',
    proposal    TEXT DEFAULT '',
    doc_path    TEXT DEFAULT '',
    created_by  TEXT DEFAULT 'scout',
    created_at  TEXT DEFAULT '',
    updated_at  TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_intel_topic  ON intel_insights (topic);
CREATE INDEX IF NOT EXISTS idx_intel_status ON intel_insights (status);

CREATE TABLE IF NOT EXISTS comments (
    id         TEXT PRIMARY KEY,
    post_id    TEXT NOT NULL,
    user_key   TEXT NOT NULL,
    text       TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'visible'
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);

CREATE TABLE IF NOT EXISTS notifications (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    type          TEXT NOT NULL,
    from_user_key TEXT,
    post_id       TEXT,
    created_at    TEXT NOT NULL,
    read          INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);

CREATE TABLE IF NOT EXISTS closet_items (
    id                 TEXT PRIMARY KEY,
    user_key           TEXT NOT NULL,
    name               TEXT NOT NULL,
    category           TEXT DEFAULT '',
    color              TEXT DEFAULT '',
    brand              TEXT DEFAULT '',
    search_query       TEXT DEFAULT '',
    price_estimate_usd INTEGER DEFAULT 0,
    image_url          TEXT DEFAULT '',
    confidence         TEXT DEFAULT '',
    source             TEXT DEFAULT 'scan',
    source_url         TEXT DEFAULT '',
    ai_original        TEXT DEFAULT '',
    client_ref         TEXT DEFAULT '',
    created_at         TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_closet_items_user_key ON closet_items (user_key);

CREATE TABLE IF NOT EXISTS scan_corrections (
    id         BIGSERIAL PRIMARY KEY,
    user_key   TEXT NOT NULL,
    item_id    TEXT DEFAULT '',
    field      TEXT NOT NULL,
    ai_value   TEXT DEFAULT '',
    user_value TEXT DEFAULT '',
    client_ref TEXT DEFAULT '',
    created_at TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_scan_corrections_user_key ON scan_corrections (user_key);
