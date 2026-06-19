import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  ActivityIndicator, StyleSheet, RefreshControl,
} from 'react-native';
import { t } from '../i18n';

const API_BASE = 'http://localhost:8000';
const USER_ID = 'user_1';
const FILTERS = ['all', 'recent', 'saved'];

function PostThumb({ item }) {
  return (
    <View style={styles.thumb}>
      <Image
        source={{
          uri:
            item.image_url ||
            `https://source.unsplash.com/300x400/?outfit,${encodeURIComponent(
              item.caption || '',
            )}`,
        }}
        style={styles.thumbImg}
        resizeMode="cover"
      />
      <Text style={styles.thumbCaption} numberOfLines={1}>
        {item.caption}
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconPlaceholder} />
      <Text style={styles.emptyTitle}>{t('wardrobe.emptyTitle')}</Text>
      <Text style={styles.emptyBody}>{t('wardrobe.emptyBody')}</Text>
    </View>
  );
}

export default function WardrobeScreen({ navigation, route }) {
  const { newImageUri } = route.params || {};
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ post_count: 0, followers: 0, following: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [postsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/posts?user_id=${USER_ID}&limit=50`),
        fetch(`${API_BASE}/api/users/${USER_ID}/stats`),
      ]);
      const postsData = await postsRes.json();
      const statsData = await statsRes.json();
      setPosts(postsData.items || postsData || []);
      setStats(statsData);
    } catch {
      // silent — keep previous state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} color="#e8526a" />;
  }

  return (
    <View style={styles.container}>
      {/* Newly captured image from Camera flow */}
      {newImageUri && (
        <View style={styles.newItem}>
          <Image source={{ uri: newImageUri }} style={styles.newImage} />
          <Text style={styles.newLabel}>{t('wardrobe.newItem')}</Text>
        </View>
      )}

      {/* Stats bar */}
      <View style={styles.statsBar}>
        {[
          { val: stats.post_count ?? posts.length, lbl: t('wardrobe.looks') },
          { val: stats.followers ?? 0, lbl: t('wardrobe.followers') },
          { val: stats.following ?? 0, lbl: t('wardrobe.following') },
        ].map(({ val, lbl }) => (
          <View key={lbl} style={styles.stat}>
            <Text style={styles.statVal}>{val}</Text>
            <Text style={styles.statLbl}>{lbl}</Text>
          </View>
        ))}
      </View>

      {/* Filter chips */}
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {t(`wardrobe.filter_${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid */}
      {posts.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => <PostThumb item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#e8526a"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0c0f' },
  newItem: { padding: 16 },
  newImage: { width: '100%', aspectRatio: 4 / 5, borderRadius: 12 },
  newLabel: { color: '#e8526a', fontSize: 13, marginTop: 8, textAlign: 'center' },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#2e2836',
  },
  stat: { alignItems: 'center' },
  statVal: { color: '#fbfbfd', fontSize: 24, fontWeight: '700' },
  statLbl: {
    color: '#8b8b9a',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#161318',
    borderWidth: 1,
    borderColor: '#2e2836',
    minHeight: 32,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: '#e8526a', borderColor: 'transparent' },
  chipText: { color: '#8b8b9a', fontSize: 13 },
  chipTextActive: { color: '#fbfbfd', fontWeight: '600' },
  grid: { padding: 8 },
  row: { gap: 8, marginBottom: 8 },
  thumb: {
    flex: 1,
    backgroundColor: '#1e1a22',
    borderRadius: 16,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', aspectRatio: 4 / 5 },
  thumbCaption: { color: '#fbfbfd', fontSize: 12, padding: 8 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyIconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e1a22',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#fbfbfd',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyBody: { color: '#8b8b9a', fontSize: 14, textAlign: 'center', maxWidth: 240 },
});
