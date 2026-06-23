import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { t } from '../i18n';

const API_BASE = 'http://localhost:8000';
const DEFAULT_USER_ID = 'user_1'; // v1 — no auth yet

const MOCK_PROFILE = {
  id: 'current_user',
  username: 'noa.style',
  display_name: 'Noa',
  avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
  bio: 'Minimalism lover ◦ Tel Aviv',
  verified: false,
};

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{Number(value || 0).toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ post_count: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/profiles/${DEFAULT_USER_ID}`).then(r => r.json()),
      fetch(`${API_BASE}/api/users/${DEFAULT_USER_ID}/stats`).then(r => r.json()),
    ])
      .then(([profileData, statsData]) => {
        setProfile(profileData);
        setStats(statsData);
      })
      .catch(() => {
        // silent fail — MOCK_PROFILE as fallback, stats remain zeroed
        setProfile(MOCK_PROFILE);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  const p = profile || MOCK_PROFILE;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: p.avatar_url }} style={styles.avatar} />
        <Text style={styles.displayName}>{p.display_name}</Text>
        <Text style={styles.username}>@{p.username}</Text>
        {p.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}
      </View>

      {/* Stats — from API, not MOCK */}
      <View style={styles.statsRow}>
        <StatBox label={t('profile.posts')} value={stats.post_count} />
        <StatBox label={t('profile.followers')} value={stats.followers} />
        <StatBox label={t('profile.following')} value={stats.following} />
      </View>

      {/* CTA */}
      <View style={styles.ctaRow}>
        <Pressable style={styles.ctaPrimary} onPress={() => navigation.navigate('Camera')}>
          <Text style={styles.ctaPrimaryText}>{t('profile.addLook')}</Text>
        </Pressable>
        <Pressable style={styles.ctaSecondary}>
          <Text style={styles.ctaSecondaryText}>{t('profile.editProfile')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  container: { flex: 1, backgroundColor: '#0e0c0f' },
  header: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  displayName: { color: '#fbfbfd', fontSize: 20, fontWeight: '700' },
  username: { color: '#8a8a9a', fontSize: 14, marginTop: 2 },
  bio: { color: '#c8c8d8', fontSize: 14, textAlign: 'center', marginTop: 8 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1e1a22' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { color: '#fbfbfd', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#8a8a9a', fontSize: 12, marginTop: 2 },
  ctaRow: { flexDirection: 'row', gap: 12, padding: 16 },
  ctaPrimary: { flex: 1, backgroundColor: '#e8526a', padding: 12, borderRadius: 8, alignItems: 'center' },
  ctaPrimaryText: { color: '#fbfbfd', fontWeight: '600', fontSize: 15 },
  ctaSecondary: { flex: 1, backgroundColor: '#1e1a22', padding: 12, borderRadius: 8, alignItems: 'center' },
  ctaSecondaryText: { color: '#fbfbfd', fontWeight: '600', fontSize: 15 },
});
