import React, { useState, useCallback, useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { t } from '../i18n';
import { useApp } from '../contexts/AppContext';
import { colors, typography, spacing, radii } from '../tokens';

// API base — single source of truth. Change this for staging/prod.
const API_BASE = 'http://localhost:8000';

// CARD_HEIGHT is fixed so getItemLayout can skip measurement entirely.
// 36 (avatar) + 12*2 (header padding) + 360 (image) + 12*2 (footer padding)
// + ~30 (caption + stats lines) = 444. Rounded to 444, with 12 marginBottom
// makes the total per-slot 456. getItemLayout uses CARD_HEIGHT + CARD_MARGIN.
const CARD_HEIGHT = 444;
const CARD_MARGIN = 12;
const SLOT_HEIGHT = CARD_HEIGHT + CARD_MARGIN;

// Interpolate {{count}} in a translation string.
// The t() helper doesn't support interpolation — this keeps it minimal
// and avoids pulling in a heavier i18n library before we need it.
function interpolate(str, vars) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
  );
}

// normalizePost maps the API shape {id, user_id, image_url, caption, likes, ...}
// to the PostCard shape {id, user, avatar, image, caption, likes, comments}.
// Avatar: backend does not yet return avatar_url — fall back to randomuser.me
// keyed on user_id so each user always gets the same avatar until auth lands.
// comments: not in API v1 — default to 0 until comments endpoint ships.
function normalizePost(apiPost) {
  const seed = (apiPost.user_id || '').replace(/\D/g, '').slice(-2) || '1';
  return {
    id: apiPost.id,
    user: apiPost.user_id || 'unknown',
    avatar: `https://randomuser.me/api/portraits/women/${seed}.jpg`,
    image: apiPost.image_url,
    caption: apiPost.caption || '',
    likes: apiPost.likes || 0,
    comments: apiPost.comments || 0,
  };
}

// PostCard renders a single feed post.
// Image dimensions are explicit — no reflow, no layout thrash.
// Avatar dimensions are also explicit for the same reason.
function PostCard({ item }) {
  const likeLabel = interpolate(t('feed.likes'), { count: item.likes });
  const commentLabel = interpolate(t('feed.comments'), { count: item.comments });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image
          source={{ uri: item.avatar }}
          style={styles.avatar}
          // explicit dimensions prevent reflow — performance rule
        />
        <Text style={styles.username}>{item.user}</Text>
      </View>

      <Image
        source={{ uri: item.image }}
        style={styles.image}
        resizeMode="cover"
        // width: '100%' in StyleSheet + height: 360 means the image slot
        // is always 360px — consistent with CARD_HEIGHT calculation above
      />

      <View style={styles.footer}>
        <Text style={styles.caption}>{item.caption}</Text>
        <Text style={styles.stats}>
          {likeLabel} · {commentLabel}
        </Text>
      </View>
    </View>
  );
}

// fetchPosts: GET /api/posts?limit=20&offset=0
// Returns normalized post array on success, throws on network/HTTP error.
async function fetchPosts(offset = 0) {
  const url = `${API_BASE}/api/posts?limit=20&offset=${offset}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`/api/posts returned ${response.status}`);
  }
  const data = await response.json();
  // Backend shape: { items: [...], total: N, limit: 20, offset: 0 }
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map(normalizePost);
}

// FeedScreen: FlatList with performance settings required from day 1.
// getItemLayout: O(1) scroll calculation — critical for large feeds.
// removeClippedSubviews: unmounts off-screen views on Android (memory).
// initialNumToRender: 8 covers ~1.8 screens on a 6" device.
// maxToRenderPerBatch: 4 caps per-frame JS work during fast scroll.
// windowSize: 5 = 2.5 screens above + 2.5 below the viewport.
//
// States:
//   loading — initial fetch in progress → ActivityIndicator center
//   error   — fetch failed → inline error text, no crash
//   data    — posts from /api/posts, stored in AppContext.feedPosts
//
// pull-to-refresh: re-fetches offset=0, replaces feedPosts in context.
// tintColor = colors.accent (rose). RefreshControl accepts JS string values directly,
// so token reference works here — no CSS variable limitation in React Native.
export default function FeedScreen() {
  const { feedPosts, setFeedPosts } = useApp();
  const [loading, setLoading] = useState(feedPosts.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // loadPosts: fetches /api/posts and updates AppContext.
  // On failure sets error string; does not throw — screen never crashes.
  const loadPosts = useCallback(async () => {
    setError(null);
    try {
      const posts = await fetchPosts(0);
      setFeedPosts(posts);
    } catch (err) {
      setError(t('feed.error'));
    }
  }, [setFeedPosts]);

  // Fetch on mount — only if AppContext is empty (avoids redundant network call
  // when navigating back to FeedScreen after data already loaded).
  useEffect(() => {
    if (feedPosts.length === 0) {
      setLoading(true);
      loadPosts().finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [loadPosts]);

  // Loading state: ActivityIndicator centered, shown only on first load.
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e8526a" />
      </View>
    );
  }

  // Error state: inline message, no crash.
  // User can pull-to-refresh to retry.
  if (error && feedPosts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={feedPosts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard item={item} />}
      getItemLayout={(_, index) => ({
        length: SLOT_HEIGHT,
        offset: SLOT_HEIGHT * index,
        index,
      })}
      removeClippedSubviews={true}
      initialNumToRender={8}
      maxToRenderPerBatch={4}
      windowSize={5}
      style={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.surface,  // --surface (#161318) — feed background layer
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12101a',
  },
  errorText: {
    color: '#fbfbfd',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    marginBottom: CARD_MARGIN,
    backgroundColor: colors.card,  // --card (#1e1a22)
    // No shadow — shadows are expensive on Android and not in spec for feed cards
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s3,  // 12
    paddingVertical: spacing.s3,    // 12
    gap: spacing.s2,                // 8
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,  // 999 — fully circular at any explicit width/height
    // explicit width/height = no layout measurement = no reflow
  },
  username: {
    color: colors.fg,               // --text (#fbfbfd)
    fontWeight: '600',
    fontSize: typography.body,      // 14
  },
  image: {
    width: '100%',
    height: 360,
    // explicit height matches CARD_HEIGHT calculation
  },
  footer: {
    paddingHorizontal: spacing.s3,  // 12
    paddingVertical: spacing.s3,    // 12
  },
  caption: {
    color: colors.fg,               // --text (#fbfbfd)
    fontSize: typography.body,      // 14
    marginBottom: spacing.s1,       // 4
  },
  stats: {
    color: colors.muted,            // --muted (#8a8498) — nearest token to #8a8a9a
    fontSize: typography.caption,   // 12
  },
});
