import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';

const API_BASE = 'http://localhost:8000';

export default function EditProfileScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { userId = 'user_1', initialData = {} } = route.params || {};

  const [displayName, setDisplayName] = useState(initialData.display_name || '');
  const [bio, setBio] = useState(initialData.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatar_url || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/auth/me/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, bio, avatar_url: avatarUrl }),
      });
      navigation.goBack();
    } catch (e) {
      // silent fail — Cycle 3 error handling
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>{t('editProfile.displayName')}</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={50}
      />
      <Text style={styles.label}>{t('editProfile.bio')}</Text>
      <TextInput
        style={styles.input}
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={150}
      />
      <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving}>
        <Text style={styles.btnText}>{saving ? '...' : t('editProfile.save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0c0f', padding: 16 },
  label: { color: '#8b8b9a', fontSize: 13, marginTop: 16, marginBottom: 4 },
  input: { backgroundColor: '#1e1a22', color: '#fbfbfd', borderRadius: 12, padding: 14, fontSize: 14 },
  btn: { backgroundColor: '#e8526a', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, minHeight: 44 },
  btnText: { color: '#fbfbfd', fontWeight: '700', fontSize: 16 },
});
