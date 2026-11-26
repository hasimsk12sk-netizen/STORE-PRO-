import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  DEFAULT_BANNER_SEEDS,
  DEFAULT_CATEGORY_SEEDS,
  DEFAULT_WEBSITE_SETTINGS,
  FIELD_LIMITS,
  STORE_PRO_DOWNLOAD_URL,
  toSlug,
} from '../config/storeProConfig';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/firebaseClient';
import type {
  AnalyticsEventType,
  WebsiteAdmin,
  WebsiteAnalyticsEvent,
  WebsiteApp,
  WebsiteBanner,
  WebsiteCategory,
  WebsiteSettings,
  WebsiteUser,
} from '../types/storePro';

const COLLECTIONS = {
  apps: 'website_apps',
  categories: 'website_categories',
  banners: 'website_banners',
  users: 'website_users',
  admins: 'website_admins',
  settings: 'website_settings',
  analytics: 'website_analytics',
} as const;

function sanitizeAppPayload(input: Omit<WebsiteApp, 'createdAt' | 'updatedAt'>): Omit<WebsiteApp, 'createdAt' | 'updatedAt'> {
  return {
    id: input.id.slice(0, FIELD_LIMITS.idMax),
    name: input.name.trim().slice(0, FIELD_LIMITS.nameMax),
    slug: toSlug(input.slug || input.name),
    iconUrl: input.iconUrl.trim().slice(0, FIELD_LIMITS.iconUrlMax),
    screenshots: input.screenshots
      .map((s) => s.trim().slice(0, FIELD_LIMITS.iconUrlMax))
      .filter(Boolean)
      .slice(0, FIELD_LIMITS.screenshotsMaxCount),
    version: input.version.trim().slice(0, FIELD_LIMITS.versionMax),
    size: input.size.trim().slice(0, FIELD_LIMITS.sizeMax),
    developerName: input.developerName.trim().slice(0, FIELD_LIMITS.developerNameMax),
    category: input.category.trim().slice(0, FIELD_LIMITS.categoryMax),
    shortDescription: input.shortDescription.trim().slice(0, FIELD_LIMITS.shortDescriptionMax),
    fullDescription: input.fullDescription.trim().slice(0, FIELD_LIMITS.fullDescriptionMax),
    features: input.features
      .map((f) => f.trim().slice(0, FIELD_LIMITS.featureItemMax))
      .filter(Boolean)
      .slice(0, FIELD_LIMITS.featuresMaxCount),
    whatsNew: input.whatsNew.trim().slice(0, FIELD_LIMITS.whatsNewMax),
    uploadDate: input.uploadDate.trim().slice(0, FIELD_LIMITS.dateMax),
    updatedDate: input.updatedDate.trim().slice(0, FIELD_LIMITS.dateMax),
    status: input.status,
    isFeatured: Boolean(input.isFeatured),
    isTrending: Boolean(input.isTrending),
    isPopular: Boolean(input.isPopular),
    downloadCount: Math.max(0, Math.floor(Number(input.downloadCount) || 0)),
    viewCount: Math.max(0, Math.floor(Number(input.viewCount) || 0)),
    createdBy: input.createdBy.slice(0, FIELD_LIMITS.idMax),
  };
}

// ---------------------------------------------------------------------------
// Public Catalog Subscriptions (Strictly Isolated to website_* Collections)
// ---------------------------------------------------------------------------

export function subscribePublishedApps(
  onData: (apps: WebsiteApp[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.apps),
    where('status', '==', 'published')
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ ...(d.data() as WebsiteApp), id: d.id }))
        .sort((a, b) => (b.updatedDate || '').localeCompare(a.updatedDate || ''));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.apps, true);
      if (onError) onError(err);
    }
  );
}

export function subscribeActiveCategories(
  onData: (categories: WebsiteCategory[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.categories),
    where('isActive', '==', true)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ ...(d.data() as WebsiteCategory), id: d.id }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.categories, true);
    }
  );
}

export function subscribeActiveBanners(
  onData: (banners: WebsiteBanner[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.banners),
    where('isActive', '==', true)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ ...(d.data() as WebsiteBanner), id: d.id }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.banners, true);
    }
  );
}

export function subscribeWebsiteSettings(
  onData: (settings: WebsiteSettings) => void
): Unsubscribe {
  const refDoc = doc(db, COLLECTIONS.settings, 'global');
  return onSnapshot(
    refDoc,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<WebsiteSettings>;
        onData({
          ...DEFAULT_WEBSITE_SETTINGS,
          ...data,
          storeProDownloadUrl: data.storeProDownloadUrl || STORE_PRO_DOWNLOAD_URL,
          updateHistory: Array.isArray(data.updateHistory)
            ? data.updateHistory
            : DEFAULT_WEBSITE_SETTINGS.updateHistory,
        });
      } else {
        onData(DEFAULT_WEBSITE_SETTINGS);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${COLLECTIONS.settings}/global`, true);
      onData(DEFAULT_WEBSITE_SETTINGS);
    }
  );
}

// ---------------------------------------------------------------------------
// Admin Subscriptions & Mutations
// ---------------------------------------------------------------------------

export async function checkIsAdmin(user: User | null): Promise<{
  isAdmin: boolean;
  isBootstrapped: boolean;
}> {
  if (!user || !user.emailVerified) {
    return { isAdmin: false, isBootstrapped: false };
  }
  const isBootstrapped = user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
  if (isBootstrapped) {
    return { isAdmin: true, isBootstrapped: true };
  }
  try {
    const adminSnap = await getDoc(doc(db, COLLECTIONS.admins, user.uid));
    return { isAdmin: adminSnap.exists(), isBootstrapped: false };
  } catch {
    return { isAdmin: false, isBootstrapped: false };
  }
}

export function subscribeAllAppsAdmin(
  isBootstrapped: boolean,
  adminUid: string,
  onData: (apps: WebsiteApp[]) => void
): Unsubscribe {
  const q = isBootstrapped
    ? collection(db, COLLECTIONS.apps)
    : query(collection(db, COLLECTIONS.apps), where('createdBy', '==', adminUid));

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ ...(d.data() as WebsiteApp), id: d.id }))
        .sort((a, b) => (b.updatedDate || '').localeCompare(a.updatedDate || ''));
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.apps)
  );
}

export function subscribeAllCategoriesAdmin(
  onData: (categories: WebsiteCategory[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.categories),
    (snap) => {
      const items = snap.docs
        .map((d) => ({ ...(d.data() as WebsiteCategory), id: d.id }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.categories)
  );
}

export function subscribeAllBannersAdmin(
  onData: (banners: WebsiteBanner[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.banners),
    (snap) => {
      const items = snap.docs
        .map((d) => ({ ...(d.data() as WebsiteBanner), id: d.id }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.banners)
  );
}

export function subscribeAnalyticsEvents(
  onData: (events: WebsiteAnalyticsEvent[]) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.analytics), orderBy('createdAt', 'desc'), limit(250));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({
        ...(d.data() as WebsiteAnalyticsEvent),
        id: d.id,
      }));
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.analytics)
  );
}

export function subscribeWebsiteUsersAdmin(
  onData: (users: WebsiteUser[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.users),
    (snap) => {
      const items = snap.docs.map((d) => d.data() as WebsiteUser);
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.users)
  );
}

export function subscribeWebsiteAdmins(
  onData: (admins: WebsiteAdmin[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.admins),
    (snap) => {
      const items = snap.docs.map((d) => d.data() as WebsiteAdmin);
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.admins)
  );
}

export async function createWebsiteApp(
  rawApp: Omit<WebsiteApp, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'downloadCount' | 'viewCount'>
): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Authentication required.');
  const docId = `${toSlug(rawApp.name).slice(0, 64)}-${Date.now().toString(36)}`;
  const payload = sanitizeAppPayload({
    ...rawApp,
    id: docId,
    downloadCount: 0,
    viewCount: 0,
    createdBy: uid,
  });

  try {
    await setDoc(doc(db, COLLECTIONS.apps, docId), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.apps}/${docId}`);
    throw err;
  }
}

export async function updateWebsiteApp(
  existingApp: WebsiteApp,
  updates: Partial<Omit<WebsiteApp, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const merged = sanitizeAppPayload({
    ...existingApp,
    ...updates,
    id: existingApp.id,
    createdBy: existingApp.createdBy,
  });

  try {
    await updateDoc(doc(db, COLLECTIONS.apps, existingApp.id), {
      ...merged,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.apps}/${existingApp.id}`);
  }
}

export async function deleteWebsiteApp(appId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.apps, appId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.apps}/${appId}`);
  }
}

export async function saveWebsiteCategory(
  category: Omit<WebsiteCategory, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const safeId = category.id.trim().slice(0, FIELD_LIMITS.idMax);
  const payload = {
    id: safeId,
    name: category.name.trim().slice(0, FIELD_LIMITS.categoryMax),
    slug: toSlug(category.slug || category.name),
    description: category.description.trim().slice(0, 240),
    iconName: category.iconName.trim().slice(0, 40) || 'Grid',
    displayOrder: Math.max(0, Math.floor(Number(category.displayOrder) || 0)),
    isActive: Boolean(category.isActive),
  };

  try {
    const refDoc = doc(db, COLLECTIONS.categories, safeId);
    if (isNew) {
      await setDoc(refDoc, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(refDoc, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(
      err,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      `${COLLECTIONS.categories}/${safeId}`
    );
  }
}

export async function deleteWebsiteCategory(categoryId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.categories, categoryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.categories}/${categoryId}`);
  }
}

export async function seedDefaultWebsiteCategories(): Promise<void> {
  for (const cat of DEFAULT_CATEGORY_SEEDS) {
    const refDoc = doc(db, COLLECTIONS.categories, cat.id);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) {
      await setDoc(refDoc, {
        ...cat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

export async function saveWebsiteBanner(
  banner: Omit<WebsiteBanner, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const safeId = banner.id.trim().slice(0, FIELD_LIMITS.idMax);
  const payload = {
    id: safeId,
    title: banner.title.trim().slice(0, 120),
    subtitle: banner.subtitle.trim().slice(0, 240),
    imageUrl: banner.imageUrl.trim().slice(0, FIELD_LIMITS.iconUrlMax),
    ctaLabel: banner.ctaLabel.trim().slice(0, 40) || 'Explore',
    targetAppId: banner.targetAppId.trim().slice(0, FIELD_LIMITS.idMax),
    targetRoute: banner.targetRoute.trim().slice(0, 160),
    displayOrder: Math.max(0, Math.floor(Number(banner.displayOrder) || 0)),
    isActive: Boolean(banner.isActive),
  };

  try {
    const refDoc = doc(db, COLLECTIONS.banners, safeId);
    if (isNew) {
      await setDoc(refDoc, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(refDoc, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(
      err,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      `${COLLECTIONS.banners}/${safeId}`
    );
  }
}

export async function deleteWebsiteBanner(bannerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.banners, bannerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.banners}/${bannerId}`);
  }
}

export async function seedDefaultWebsiteBanners(): Promise<void> {
  for (const banner of DEFAULT_BANNER_SEEDS) {
    const refDoc = doc(db, COLLECTIONS.banners, banner.id);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) {
      await setDoc(refDoc, {
        ...banner,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

export async function saveWebsiteSettings(settings: WebsiteSettings): Promise<void> {
  const payload: WebsiteSettings = {
    storeProDownloadUrl: (settings.storeProDownloadUrl || STORE_PRO_DOWNLOAD_URL).trim().slice(0, 500),
    websiteName: (settings.websiteName || 'STORE PRO').trim().slice(0, 80),
    websiteLogoUrl: (settings.websiteLogoUrl || '').trim().slice(0, FIELD_LIMITS.iconUrlMax),
    websiteDescription: (settings.websiteDescription || '').trim().slice(0, 300),
    themeAccent: (settings.themeAccent || 'gold').trim().slice(0, 30),
    contactEmail: (settings.contactEmail || '').trim().slice(0, 160),
    supportUrl: (settings.supportUrl || '').trim().slice(0, 300),
    twitterUrl: (settings.twitterUrl || '').trim().slice(0, 300),
    telegramUrl: (settings.telegramUrl || '').trim().slice(0, 300),
    githubUrl: (settings.githubUrl || '').trim().slice(0, 300),
    seoTitle: (settings.seoTitle || '').trim().slice(0, 120),
    seoDescription: (settings.seoDescription || '').trim().slice(0, 240),
    seoKeywords: (settings.seoKeywords || '').trim().slice(0, 300),
    latestStoreProVersion: (settings.latestStoreProVersion || '3.4.0').trim().slice(0, 40),
    latestStoreProVersionName: (settings.latestStoreProVersionName || '').trim().slice(0, 80),
    latestReleaseNotes: (settings.latestReleaseNotes || '').trim().slice(0, 3000),
    latestReleaseDate: (settings.latestReleaseDate || '').trim().slice(0, 30),
    updateHistory: (settings.updateHistory || []).slice(0, 25).map((h) => h.trim().slice(0, 400)),
  };

  try {
    await setDoc(doc(db, COLLECTIONS.settings, 'global'), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.settings}/global`);
  }
}

export async function addWebsiteAdmin(uid: string, email: string, displayName: string): Promise<void> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) throw new Error('Authentication required.');
  const cleanUid = uid.trim().slice(0, FIELD_LIMITS.idMax);
  try {
    await setDoc(doc(db, COLLECTIONS.admins, cleanUid), {
      uid: cleanUid,
      email: email.trim().slice(0, 160),
      displayName: displayName.trim().slice(0, 100),
      addedBy: currentUid,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.admins}/${cleanUid}`);
  }
}

export async function removeWebsiteAdmin(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.admins, uid));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.admins}/${uid}`);
  }
}

// ---------------------------------------------------------------------------
// User Account, Library, Favorites & History
// ---------------------------------------------------------------------------

export function subscribeUserProfile(
  uid: string,
  onData: (profile: WebsiteUser | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTIONS.users, uid),
    (snap) => {
      onData(snap.exists() ? (snap.data() as WebsiteUser) : null);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `${COLLECTIONS.users}/${uid}`, true)
  );
}

export async function ensureWebsiteUserProfile(user: User): Promise<void> {
  if (!user.emailVerified) return;
  const refDoc = doc(db, COLLECTIONS.users, user.uid);
  try {
    const snap = await getDoc(refDoc);
    if (!snap.exists()) {
      await setDoc(refDoc, {
        uid: user.uid,
        email: (user.email || '').slice(0, 160),
        displayName: (user.displayName || 'STORE PRO Member').slice(0, 100),
        photoURL: (user.photoURL || '').slice(0, 500),
        savedAppIds: [],
        favoriteAppIds: [],
        browsingHistory: [],
        searchHistory: [],
        notificationsEnabled: true,
        compactMode: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(refDoc, {
        email: (user.email || '').slice(0, 160),
        displayName: (user.displayName || 'STORE PRO Member').slice(0, 100),
        photoURL: (user.photoURL || '').slice(0, 500),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.users}/${user.uid}`, true);
  }
}

export async function toggleSavedApp(uid: string, appId: string, currentlySaved: boolean): Promise<void> {
  const refDoc = doc(db, COLLECTIONS.users, uid);
  try {
    await updateDoc(refDoc, {
      savedAppIds: currentlySaved ? arrayRemove(appId) : arrayUnion(appId),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.users}/${uid}`);
  }
}

export async function toggleFavoriteApp(uid: string, appId: string, currentlyFav: boolean): Promise<void> {
  const refDoc = doc(db, COLLECTIONS.users, uid);
  try {
    await updateDoc(refDoc, {
      favoriteAppIds: currentlyFav ? arrayRemove(appId) : arrayUnion(appId),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.users}/${uid}`);
  }
}

export async function recordUserBrowsingHistory(
  uid: string,
  currentHistory: string[],
  appId: string
): Promise<void> {
  const updated = [appId, ...currentHistory.filter((id) => id !== appId)].slice(
    0,
    FIELD_LIMITS.browsingHistoryMax
  );
  try {
    await updateDoc(doc(db, COLLECTIONS.users, uid), {
      browsingHistory: updated,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.users}/${uid}`, true);
  }
}

export async function recordUserSearchHistory(
  uid: string,
  currentSearches: string[],
  term: string
): Promise<void> {
  const clean = term.trim().slice(0, 80);
  if (!clean) return;
  const updated = [clean, ...currentSearches.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    FIELD_LIMITS.searchHistoryMax
  );
  try {
    await updateDoc(doc(db, COLLECTIONS.users, uid), {
      searchHistory: updated,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.users}/${uid}`, true);
  }
}

export async function updateUserPreferences(
  uid: string,
  prefs: { notificationsEnabled?: boolean; compactMode?: boolean }
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.users, uid), {
      ...prefs,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.users}/${uid}`);
  }
}

// ---------------------------------------------------------------------------
// Analytics Tracking (Views, INSTALL Clicks, STORE PRO Redirects Separated)
// ---------------------------------------------------------------------------

export async function trackWebsiteEvent(
  eventType: AnalyticsEventType,
  app: Pick<WebsiteApp, 'id' | 'name' | 'category'>
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    // Public visitors do not write to Firestore directly; verified users persist analytics cleanly.
    return;
  }

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);

  try {
    await addDoc(collection(db, COLLECTIONS.analytics), {
      eventType,
      appId: app.id.slice(0, FIELD_LIMITS.idMax),
      appName: app.name.slice(0, FIELD_LIMITS.nameMax),
      category: app.category.slice(0, FIELD_LIMITS.categoryMax),
      userId: currentUser.uid,
      dateKey,
      createdAt: serverTimestamp(),
    });

    if (eventType === 'install_click' || eventType === 'app_view') {
      const appRef = doc(db, COLLECTIONS.apps, app.id);
      await updateDoc(appRef, {
        ...(eventType === 'install_click' ? { downloadCount: increment(1) } : { viewCount: increment(1) }),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.analytics, true);
  }
}
