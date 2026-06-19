import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { t } from '../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = ['screen1', 'screen2', 'screen3'];

export default function OnboardingScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);

  const isLast = activeIndex === STEPS.length - 1;

  async function handleFinish() {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    navigation.navigate('Feed');
  }

  function handleNext() {
    if (isLast) {
      handleFinish();
      return;
    }
    const next = activeIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  }

  function handleSkip() {
    handleFinish();
  }

  function handleScroll(event) {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }

  function renderStep({ item: stepKey }) {
    return (
      <View style={styles.slide}>
        {/* Icon placeholder — will be replaced with SVG icon in Cycle 3 */}
        <View
          style={styles.iconPlaceholder}
          accessibilityRole="image"
          accessibilityLabel={t(`onboarding.${stepKey}.title`)}
        />
        <Text style={styles.title}>{t(`onboarding.${stepKey}.title`)}</Text>
        <Text style={styles.body}>{t(`onboarding.${stepKey}.body`)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Skip — hidden on last screen */}
      {!isLast && (
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </Pressable>
      )}

      <FlatList
        ref={listRef}
        data={STEPS}
        keyExtractor={(item) => item}
        renderItem={renderStep}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <Pressable style={styles.ctaButton} onPress={handleNext}>
          <Text style={styles.ctaText}>
            {isLast ? t('onboarding.start') : t('onboarding.next')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0c0f' },

  /* Skip */
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    color: '#8a8a9a',
    fontSize: 15,
  },

  /* Slide */
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1e1a22',
    marginBottom: 32,
  },
  title: {
    color: '#fbfbfd',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: '#8a8a9a',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* Dots */
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3a3444',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#e8526a',
  },

  /* Footer */
  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  ctaButton: {
    backgroundColor: '#e8526a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  ctaText: { color: '#fbfbfd', fontSize: 16, fontWeight: '700' },
});
