import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable } from 'react-native';
import { t } from '../i18n';

const MOCK_PROFILE = {
  id: 'current_user',
  username: 'noa.style',
  display_name: 'נועה',
  avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
  bio: 'אוהבת מינימליזם ◦ תל אביב',
  followers: 1240,
  following: 380,
  posts_count: 23,
  verified: false,
};

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const p = MOCK_PROFILE;
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: p.avatar_url }} style={styles.avatar} />
        <Text style={styles.displayName}>{p.display_name}</Text>
        <Text style={styles.username}>@{p.username}</Text>
        {p.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox label={t('profile.posts')} value={p.posts_count} />
        <StatBox label={t('profile.followers')} value={p.followers} />
        <StatBox label={t('profile.following')} value={p.following} />
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
