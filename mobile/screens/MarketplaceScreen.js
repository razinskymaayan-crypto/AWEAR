import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../i18n/useTranslation';

// API_BASE — single source of truth, consistent with FeedScreen.js
const API_BASE = 'http://localhost:8000';

// ITEM_HEIGHT is the full height of one ProductCard row (2 columns).
// Used for FlatList.getItemLayout — eliminates scroll-position recalculation.
// image: 4/5 aspect-ratio on ~180px wide card = ~225px
// info block: name(20) + price(24) + badge(22) + padding(16) = ~82px
// total per card: ~307px. Row = max of both cards in same row.
const CARD_WIDTH = 180;
const CARD_IMAGE_HEIGHT = Math.round(CARD_WIDTH * (5 / 4)); // 225
const CARD_INFO_HEIGHT = 82;
const CARD_HEIGHT = CARD_IMAGE_HEIGHT + CARD_INFO_HEIGHT; // 307
const ROW_MARGIN = 8;
const ITEM_HEIGHT = CARD_HEIGHT + ROW_MARGIN; // 315

// condition → design-token background hex (per marketplace_mobile_spec.md)
// like-new=var(--success)=#52c97a, good=var(--accent2)=#c4714a, fair=var(--muted)=#8a8498
const CONDITION_BG = {
  'like-new': 'rgba(82,201,122,0.15)',
  'good': 'rgba(196,113,74,0.15)',
  'fair': 'rgba(138,132,152,0.15)',
};
const CONDITION_COLOR = {
  'like-new': '#52c97a',
  'good': '#c4714a',
  'fair': '#8a8498',
};
const VALID_CONDITIONS = new Set(['like-new', 'good', 'fair']);

// Category list mirrors what /api/categories returns.
// 'all' is a local sentinel — not sent as a filter to the API.
const CATEGORIES = ['all', 'shoes', 'pants', 'shirts', 'jackets', 'accessories', 'dresses'];

function ConditionBadge({ condition, t }) {
  if (!VALID_CONDITIONS.has(condition)) return null;
  const keyMap = { 'like-new': 'likenew', 'good': 'good', 'fair': 'fair' };
  const label = t(`marketplace.condition.${keyMap[condition]}`);
  return (
    <View style={[styles.badge, { backgroundColor: CONDITION_BG[condition] }]}>
      <Text style={[styles.badgeText, { color: CONDITION_COLOR[condition] }]}>
        {label}
      </Text>
    </View>
  );
}

// heart icon SVG path from lucide.dev/heart (same source as web ICONS object).
// Two View layers simulate outline vs filled states — no emoji, no icon library dep.
// Replace with icon('heart', 18) once RN icon system is wired (Cycle 3).
function HeartButton({ liked, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      style={styles.heartBtn}
    >
      <View
        style={[
          styles.heartShape,
          liked ? styles.heartShapeFilled : styles.heartShapeOutline,
        ]}
      />
    </TouchableOpacity>
  );
}

function ProductCard({ item, t }) {
  const [liked, setLiked] = useState(false);
  const condition = item.condition || 'good';

  return (
    <View style={styles.card}>
      <Image
        source={{
          uri:
            item.image_url ||
            `https://source.unsplash.com/300x400/?fashion,${encodeURIComponent(item.name || '')}`,
        }}
        style={styles.cardImg}
        resizeMode="cover"
      />
      <HeartButton liked={liked} onPress={() => setLiked(v => !v)} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardPrice}>
          ${item.price_usd ?? item.price ?? 0}
        </Text>
        <ConditionBadge condition={condition} t={t} />
      </View>
    </View>
  );
}

function CategoryChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function MarketplaceScreen() {
  const { t } = useTranslation();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetch(`${API_BASE}/api/products?limit=50`)
      .then(r => r.json())
      .then(data => setAllProducts(data.items || data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const products =
    selectedCategory === 'all'
      ? allProducts
      : allProducts.filter(p => p.category === selectedCategory);

  // getItemLayout: FlatList can skip layout calculation for each row.
  // Only works correctly because all cards have the same fixed height (ITEM_HEIGHT).
  const getItemLayout = useCallback(
    (_data, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} color="#e8526a" />;
  }

  if (error || products.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('marketplace.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('marketplace.title')}</Text>
      </View>

      {/* Category filter chips — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {CATEGORIES.map(cat => (
          <CategoryChip
            key={cat}
            label={t(`marketplace.category.${cat}`)}
            active={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>

      {/* Product grid */}
      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        getItemLayout={getItemLayout}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={5}
        renderItem={({ item }) => <ProductCard item={item} t={t} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0e0c0f' },
  loader: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#fbfbfd',
    fontSize: 20,
    fontWeight: '700',
  },

  // Category chips
  chips: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 22,
    backgroundColor: '#1e1a22',
    minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: '#e8526a' },
  chipText: { color: '#8a8498', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fbfbfd' },

  // Product grid
  list: { padding: 8 },
  row: { gap: 8, marginBottom: 8 },

  // Product card
  card: {
    flex: 1,
    backgroundColor: '#1e1a22',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 44,
  },
  cardImg: { width: '100%', aspectRatio: 4 / 5 },
  cardInfo: { padding: 8 },
  cardName: {
    color: '#fbfbfd',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardPrice: {
    color: '#e8526a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  // Condition badge
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Heart button — absolute top-right of card
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(14,12,15,0.55)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Simplified heart indicator: solid circle as placeholder for icon('heart',18).
  // Cycle 3: replace with proper SVG icon from ICONS object (RN port).
  heartShape: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  heartShapeOutline: {
    borderColor: '#fbfbfd',
    backgroundColor: 'transparent',
  },
  heartShapeFilled: {
    borderColor: '#e8526a',
    backgroundColor: '#e8526a',
  },

  // Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#8a8498', fontSize: 14 },
});
