import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from '../i18n/useTranslation';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !username || !password) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });
      if (res.ok) {
        navigation.navigate('Main'); // Tab.Navigator
      }
    } catch (e) {
      // silent fail for now — Cycle 3 proper error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>{t('register.title')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('register.email')}
        placeholderTextColor="#5a5a6a"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder={t('register.username')}
        placeholderTextColor="#5a5a6a"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder={t('register.password')}
        placeholderTextColor="#5a5a6a"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.btn}
        onPress={handleRegister}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={t('register.cta')}
      >
        <Text style={styles.btnText}>
          {loading ? '...' : t('register.cta')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Main')}
        style={styles.skip}
        accessibilityRole="button"
        accessibilityLabel={t('register.skip')}
      >
        <Text style={styles.skipText}>{t('register.skip')}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0c0f',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fbfbfd',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1a22',
    color: '#fbfbfd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#e8526a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnText: {
    color: '#fbfbfd',
    fontWeight: '700',
    fontSize: 16,
  },
  skip: {
    marginTop: 16,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    color: '#8b8b9a',
    fontSize: 13,
  },
});
