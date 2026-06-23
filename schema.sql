-- AWEAR backend schema — PostgreSQL

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    handle      TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    city        TEXT DEFAULT 'Tel Aviv',
    bio         TEXT DEFAULT '',
    photo_url   TEXT,
    style_vibes TEXT[],
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE CASCADE,
    caption     TEXT,
    photo_url   TEXT,
    items       JSONB NOT NULL DEFAULT '[]',
    tags        TEXT[],
    trend_score INT DEFAULT 80,
    look_total  INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE follows (
    follower_id INT REFERENCES users(id) ON DELETE CASCADE,
    following_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE likes (
    user_id     INT REFERENCES users(id) ON DELETE CASCADE,
    post_id     INT REFERENCES posts(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE comments (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE CASCADE,
    post_id     INT REFERENCES posts(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wardrobe_items (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    category        TEXT,
    color           TEXT,
    brand_vibe      TEXT,
    style_tags      TEXT[],
    price_ils       INT,
    search_query    TEXT,
    resale_potential TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX ON posts(user_id);
CREATE INDEX ON posts(created_at DESC);
CREATE INDEX ON follows(follower_id);
CREATE INDEX ON follows(following_id);
CREATE INDEX ON likes(post_id);
CREATE INDEX ON wardrobe_items(user_id);
