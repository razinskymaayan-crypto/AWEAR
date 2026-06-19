# Mobile Branches — Merge Checklist

## fix/camera-compression-onpress (דנה)
- [ ] expo-image-manipulator ב-package.json ✅
- [ ] compressForUpload(uri) קיים ב-CameraScreen.js ✅
- [ ] capturedPrimaryButton.onPress מחובר ✅
- [ ] Wardrobe route קיים (WardrobeScreen.js — דנה בונה עכשיו)
- [ ] Metro bundle EXIT 0 (לא נבדק — חסם למיזוג)
→ **חכה ל-WardrobeScreen להתמזג ראשון**

## feat/feed-screen-mobile (רועי)
- [ ] FlatList + getItemLayout ✅
- [ ] 3 PostCard hardcoded ✅
- [ ] i18n namespace feed ✅ (en + he)
- [ ] AppContext.js ✅ (רועי עובד עכשיו)
- [ ] pull-to-refresh ✅ (רועי עובד עכשיו)
- [ ] Metro bundle EXIT 0 (לא נבדק — חסם למיזוג)
→ **ממתין לסיום AppContext commit**

## סדר מיזוג מוצע:
1. feat/wardrobe-screen-stub (דנה)
2. fix/camera-compression-onpress (דנה)
3. feat/feed-screen-mobile (רועי, כולל AppContext)
