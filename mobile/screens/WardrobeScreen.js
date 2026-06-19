import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import { t } from '../i18n';

export default function WardrobeScreen({ navigation, route }) {
  const { newImageUri } = route.params || {};

  return (
    <ScrollView style={styles.container}>
      {newImageUri && (
        <View style={styles.newItem}>
          <Image source={{ uri: newImageUri }} style={styles.newImage} />
          <Text style={styles.newLabel}>{t('wardrobe.newItem')}</Text>
        </View>
      )}
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t('wardrobe.emptyTitle')}</Text>
        <Text style={styles.emptyBody}>{t('wardrobe.emptyBody')}</Text>
        <Pressable
          style={styles.cta}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.ctaText}>{t('wardrobe.cta')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0c0f' },
  newItem: { padding: 16 },
  newImage: { width: '100%', aspectRatio: 4 / 5, borderRadius: 12 },
  newLabel: { color: '#e8526a', fontSize: 13, marginTop: 8, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { color: '#fbfbfd', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: '#8a8a9a', fontSize: 15, textAlign: 'center', marginBottom: 24 },
  cta: { backgroundColor: '#e8526a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  ctaText: { color: '#fbfbfd', fontWeight: '600', fontSize: 15 },
});
