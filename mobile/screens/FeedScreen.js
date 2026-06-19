import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, View, Image, Text, StyleSheet } from 'react-native';
import { t } from '../i18n';
import { useApp } from '../contexts/AppContext';

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

// 3 hardcoded post cards — no API, no network, no spinner.
// Images are Unsplash fashion photos; avatars from randomuser.me.
// Real data integration tracked separately (cycle 2+, pending backend schema).
const SAMPLE_POSTS = [
  {
    id: 'post_001',
    user: 'noa.style',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    caption: 'Minimal fit, maximum confidence.',
    likes: 234,
    comments: 12,
  },
  {
    id: 'post_002',
    user: 'maya.fits',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
    caption: 'Vintage vibes all day.',
    likes: 891,
    comments: 45,
  },
  {
    id: 'post_003',
    user: 'shira_looks',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    image:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80',
    caption: 'Street style TLV.',
    likes: 1205,
    comments: 67,
  },
];

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

// FeedScreen: FlatList with performance settings required from day 1.
// getItemLayout: O(1) scroll calculation — critical for large feeds.
// removeClippedSubviews: unmounts off-screen views on Android (memory).
// initialNumToRender: 8 covers ~1.8 screens on a 6" device.
// maxToRenderPerBatch: 4 caps per-frame JS work during fast scroll.
// windowSize: 5 = 2.5 screens above + 2.5 below the viewport.
//
// pull-to-refresh: RefreshControl with 800ms simulated delay.
// Future: onRefresh will call GET /api/posts and update feedPosts in AppContext.
// tintColor/#e8526a = AWEAR rose accent (from tokens, not hardcoded by choice —
// RefreshControl does not support CSS variables, so the hex must be literal here).
export default function FeedScreen() {
  // AppContext: locale drives future t(key, locale) calls; feedPosts will hold
  // API results when backend integration lands (Cycle 2).
  const { locale, feedPosts, setFeedPosts } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate network latency. Replace with fetch('/api/posts') in Cycle 2.
    // feedPosts is available in AppContext — API results will call setFeedPosts.
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, [setFeedPosts]);

  // Use feedPosts from context when populated (future API); fall back to
  // SAMPLE_POSTS so the screen is never empty on first load or offline.
  const data = feedPosts.length > 0 ? feedPosts : SAMPLE_POSTS;

  return (
    <FlatList
      data={data}
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
          tintColor="#e8526a"
          colors={['#e8526a']}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#12101a',
  },
  card: {
    marginBottom: CARD_MARGIN,
    backgroundColor: '#1e1a22',
    // No shadow — shadows are expensive on Android and not in spec for feed cards
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // explicit width/height = no layout measurement = no reflow
  },
  username: {
    color: '#fbfbfd',
    fontWeight: '600',
    fontSize: 14,
  },
  image: {
    width: '100%',
    height: 360,
    // explicit height matches CARD_HEIGHT calculation
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  caption: {
    color: '#fbfbfd',
    fontSize: 14,
    marginBottom: 4,
  },
  stats: {
    color: '#8a8a9a',
    fontSize: 12,
  },
});
