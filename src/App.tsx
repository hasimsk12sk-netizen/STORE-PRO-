import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  CANONICAL_WEBSITE_URL,
  DEFAULT_CATEGORY_SEEDS,
  DEFAULT_WEBSITE_SETTINGS,
  GENERATED_MEDIA,
  OFFICIAL_FOOTER_DESCRIPTION,
  sanitizeExternalUrl,
  sanitizeImageSrc,
} from './config/storeProConfig';
import { auth, googleProvider } from './firebase/firebaseClient';
import {
  checkIsAdmin,
  ensureWebsiteUserProfile,
  recordUserBrowsingHistory,
  recordUserSearchHistory,
  subscribeActiveBanners,
  subscribeActiveCategories,
  subscribeAllAppsAdmin,
  subscribeAllBannersAdmin,
  subscribeAllCategoriesAdmin,
  subscribeAnalyticsEvents,
  subscribePublishedApps,
  subscribeUserProfile,
  subscribeWebsiteAdmins,
  subscribeWebsiteSettings,
  subscribeWebsiteUsersAdmin,
  toggleFavoriteApp,
  toggleSavedApp,
  trackWebsiteEvent,
} from './services/firestoreService';
import type {
  NavSection,
  WebsiteAdmin,
  WebsiteAnalyticsEvent,
  WebsiteApp,
  WebsiteBanner,
  WebsiteCategory,
  WebsiteSettings,
  WebsiteUser,
} from './types/storePro';
import { HomeView } from './components/HomeView';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/PWAInstallButton';

const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AppDetailView = lazy(() =>
  import('./components/AppDetailView').then((m) => ({ default: m.AppDetailView }))
);
const AppCatalogView = lazy(() =>
  import('./components/CatalogViews').then((m) => ({ default: m.AppCatalogView }))
);
const CategoriesView = lazy(() =>
  import('./components/CatalogViews').then((m) => ({ default: m.CategoriesView }))
);
const MyLibraryView = lazy(() =>
  import('./components/CatalogViews').then((m) => ({ default: m.MyLibraryView }))
);
const UpdatesInfoView = lazy(() =>
  import('./components/CatalogViews').then((m) => ({ default: m.UpdatesInfoView }))
);
const AboutUsView = lazy(() =>
  import('./components/CatalogViews').then((m) => ({ default: m.AboutUsView }))
);
const ProfileView = lazy(() =>
  import('./components/CatalogViews').then((m) => ({ default: m.ProfileView }))
);
const InstallWorkflowModal = lazy(() =>
  import('./components/InstallWorkflowModal').then((m) => ({ default: m.InstallWorkflowModal }))
);

const EMPTY_IDS: string[] = [];

const ViewFallback = () => (
  <div className="sp-rgb-card p-8 text-center text-sm text-[#B8BFCE]">
    Loading view...
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBootstrappedAdmin, setIsBootstrappedAdmin] = useState(false);

  const [publishedApps, setPublishedApps] = useState<WebsiteApp[]>([]);
  const [categories, setCategories] = useState<WebsiteCategory[]>(
    DEFAULT_CATEGORY_SEEDS as WebsiteCategory[]
  );
  const [banners, setBanners] = useState<WebsiteBanner[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [userProfile, setUserProfile] = useState<WebsiteUser | null>(null);

  // Admin state
  const [adminApps, setAdminApps] = useState<WebsiteApp[]>([]);
  const [adminCategories, setAdminCategories] = useState<WebsiteCategory[]>([]);
  const [adminBanners, setAdminBanners] = useState<WebsiteBanner[]>([]);
  const [analytics, setAnalytics] = useState<WebsiteAnalyticsEvent[]>([]);
  const [websiteUsers, setWebsiteUsers] = useState<WebsiteUser[]>([]);
  const [websiteAdmins, setWebsiteAdmins] = useState<WebsiteAdmin[]>([]);

  // Navigation & UI state
  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchHistory, setLocalSearchHistory] = useState<string[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  // Install workflow modal state
  const [installTargetApp, setInstallTargetApp] = useState<WebsiteApp | null>(null);
  const [directStoreProDownload, setDirectStoreProDownload] = useState(false);

  const userRef = useRef<User | null>(null);
  const userProfileRef = useRef<WebsiteUser | null>(null);
  userRef.current = user;
  userProfileRef.current = userProfile;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get('app');
    const viewParam = params.get('view') as NavSection | null;
    const queryParam = params.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
    }
    if (appParam) {
      setSelectedAppId(appParam);
      setActiveSection('app-detail');
    } else if (
      viewParam &&
      [
        'home',
        'apps',
        'categories',
        'trending',
        'top-downloads',
        'library',
        'updates',
        'about',
        'profile',
      ].includes(viewParam)
    ) {
      setActiveSection(viewParam);
    }
  }, []);

  useEffect(() => {
    const isPublicSection = activeSection !== 'admin';
    const robotsContent = isPublicSection
      ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      : 'noindex, nofollow';

    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el && content) {
        el.setAttribute('content', content);
      }
    };

    setMeta('meta[name="robots"]', robotsContent);
    setMeta('meta[name="googlebot"]', robotsContent);

    let canonicalHref = CANONICAL_WEBSITE_URL;
    if (activeSection === 'app-detail' && selectedAppId) {
      canonicalHref = `${CANONICAL_WEBSITE_URL}?app=${encodeURIComponent(selectedAppId)}`;
    } else if (
      activeSection === 'apps' ||
      activeSection === 'categories' ||
      activeSection === 'trending' ||
      activeSection === 'top-downloads' ||
      activeSection === 'updates' ||
      activeSection === 'about'
    ) {
      canonicalHref = `${CANONICAL_WEBSITE_URL}?view=${activeSection}`;
    }

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', canonicalHref);
    }
    setMeta('meta[property="og:url"]', canonicalHref);
    setMeta('meta[name="twitter:url"]', canonicalHref);

    if (activeSection === 'app-detail') return;

    const title = settings.seoTitle || DEFAULT_WEBSITE_SETTINGS.seoTitle;
    const desc = settings.seoDescription || DEFAULT_WEBSITE_SETTINGS.seoDescription;
    const keywords = settings.seoKeywords || DEFAULT_WEBSITE_SETTINGS.seoKeywords;

    document.title = title;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[name="keywords"]', keywords);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', desc);
  }, [
    settings.seoTitle,
    settings.seoDescription,
    settings.seoKeywords,
    activeSection,
    selectedAppId,
  ]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await ensureWebsiteUserProfile(currentUser);
        const role = await checkIsAdmin(currentUser);
        setIsAdmin(role.isAdmin);
        setIsBootstrappedAdmin(role.isBootstrapped);
      } else {
        setIsAdmin(false);
        setIsBootstrappedAdmin(false);
        setUserProfile(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubApps = subscribePublishedApps(setPublishedApps);
    const unsubCats = subscribeActiveCategories((items) => {
      setCategories(
        items.length > 0 ? items : (DEFAULT_CATEGORY_SEEDS as WebsiteCategory[])
      );
    });
    const unsubBanners = subscribeActiveBanners(setBanners);
    const unsubSettings = subscribeWebsiteSettings(setSettings);

    return () => {
      unsubApps();
      unsubCats();
      unsubBanners();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    const unsub = subscribeUserProfile(user.uid, setUserProfile);
    return () => unsub();
  }, [authReady, user]);

  useEffect(() => {
    if (!authReady || !user || !isAdmin || activeSection !== 'admin') return;
    const unsubApps = subscribeAllAppsAdmin(isBootstrappedAdmin, user.uid, setAdminApps);
    const unsubCats = subscribeAllCategoriesAdmin(setAdminCategories);
    const unsubBanners = subscribeAllBannersAdmin(setAdminBanners);
    const unsubAnalytics = subscribeAnalyticsEvents(setAnalytics);
    const unsubUsers = subscribeWebsiteUsersAdmin(setWebsiteUsers);
    const unsubAdmins = subscribeWebsiteAdmins(setWebsiteAdmins);

    return () => {
      unsubApps();
      unsubCats();
      unsubBanners();
      unsubAnalytics();
      unsubUsers();
      unsubAdmins();
    };
  }, [authReady, user, isAdmin, isBootstrappedAdmin, activeSection]);

  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in cancelled.';
      setAuthError(msg);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    setActiveSection((prev) => (prev === 'admin' ? 'home' : prev));
  }, []);

  const handleNavigate = useCallback((section: NavSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenDetail = useCallback((app: WebsiteApp) => {
    setSelectedAppId(app.id);
    setActiveSection('app-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void trackWebsiteEvent('app_view', app);
    const currentUser = userRef.current;
    const currentProfile = userProfileRef.current;
    if (currentUser && currentProfile) {
      void recordUserBrowsingHistory(
        currentUser.uid,
        currentProfile.browsingHistory || EMPTY_IDS,
        app.id
      );
    }
  }, []);

  const handleInstallClick = useCallback((app: WebsiteApp) => {
    void trackWebsiteEvent('install_click', app);
    setDirectStoreProDownload(false);
    setInstallTargetApp(app);
  }, []);

  const handleDirectStoreProDownload = useCallback(() => {
    setInstallTargetApp(null);
    setDirectStoreProDownload(true);
  }, []);

  const handleRedirectTracked = useCallback((app: WebsiteApp | null) => {
    void trackWebsiteEvent(
      'storepro_redirect',
      app || {
        id: 'store-pro-client',
        name: 'STORE PRO APK',
        category: 'Official Client',
      }
    );
  }, []);

  const handleSubmitSearch = useCallback(
    (term: string) => {
      const clean = term.trim();
      if (!clean) return;
      setLocalSearchHistory((prev) =>
        [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, 10)
      );
      const currentUser = userRef.current;
      const currentProfile = userProfileRef.current;
      if (currentUser && currentProfile) {
        void recordUserSearchHistory(
          currentUser.uid,
          currentProfile.searchHistory || EMPTY_IDS,
          clean
        );
      }
      if (activeSection === 'home' || activeSection === 'app-detail') {
        setActiveSection('apps');
      }
    },
    [activeSection]
  );

  const handleSelectCategory = useCallback((catName: string) => {
    setSelectedCategory(catName);
    setActiveSection('apps');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleToggleSave = useCallback(
    (appId: string) => {
      const currentUser = userRef.current;
      if (!currentUser) {
        void handleSignIn();
        return;
      }
      const currentlySaved = (userProfileRef.current?.savedAppIds || EMPTY_IDS).includes(appId);
      void toggleSavedApp(currentUser.uid, appId, currentlySaved);
    },
    [handleSignIn]
  );

  const handleToggleFavorite = useCallback(
    (appId: string) => {
      const currentUser = userRef.current;
      if (!currentUser) {
        void handleSignIn();
        return;
      }
      const currentlyFav = (userProfileRef.current?.favoriteAppIds || EMPTY_IDS).includes(appId);
      void toggleFavoriteApp(currentUser.uid, appId, currentlyFav);
    },
    [handleSignIn]
  );

  const savedAppIds = useMemo(
    () => userProfile?.savedAppIds || EMPTY_IDS,
    [userProfile?.savedAppIds]
  );
  const favoriteAppIds = useMemo(
    () => userProfile?.favoriteAppIds || EMPTY_IDS,
    [userProfile?.favoriteAppIds]
  );

  const selectedApp = useMemo(
    () => publishedApps.find((a) => a.id === selectedAppId) || null,
    [publishedApps, selectedAppId]
  );

  const combinedSearchHistory = useMemo(() => {
    const remote = userProfile?.searchHistory || [];
    return Array.from(new Set([...remote, ...localSearchHistory])).slice(0, 10);
  }, [userProfile, localSearchHistory]);

  const footerLogo = sanitizeImageSrc(settings.websiteLogoUrl) || GENERATED_MEDIA.logo9075;

  return (
    <div className="min-h-screen sp-light-canvas text-[#0B0D12] flex flex-col">
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        user={user}
        isAdmin={isAdmin}
        settings={settings}
        onSignIn={() => void handleSignIn()}
      />

      {authError && (
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 pt-4">
          <div className="sp-rgb-dock px-4 py-3 text-xs text-red-300 flex items-center justify-between gap-4">
            <span>{authError}</span>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="underline cursor-pointer text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 pt-6 sm:pt-8">
        {activeSection === 'home' && (
          <HomeView
            apps={publishedApps}
            categories={categories}
            banners={banners}
            settings={settings}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSubmitSearch={handleSubmitSearch}
            searchHistory={combinedSearchHistory}
            savedAppIds={savedAppIds}
            favoriteAppIds={favoriteAppIds}
            onToggleSave={handleToggleSave}
            onToggleFavorite={handleToggleFavorite}
            onOpenDetail={handleOpenDetail}
            onInstallClick={handleInstallClick}
            onDownloadStorePro={handleDirectStoreProDownload}
            onNavigate={handleNavigate}
            onSelectCategory={handleSelectCategory}
            isAdmin={isAdmin}
          />
        )}

        <Suspense fallback={<ViewFallback />}>
          {(activeSection === 'apps' ||
            activeSection === 'trending' ||
            activeSection === 'top-downloads') && (
            <AppCatalogView
              mode={activeSection}
              apps={publishedApps}
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSubmitSearch={handleSubmitSearch}
              searchHistory={combinedSearchHistory}
              savedAppIds={savedAppIds}
              favoriteAppIds={favoriteAppIds}
              onToggleSave={handleToggleSave}
              onToggleFavorite={handleToggleFavorite}
              onOpenDetail={handleOpenDetail}
              onInstallClick={handleInstallClick}
            />
          )}

          {activeSection === 'categories' && (
            <CategoriesView
              categories={categories}
              apps={publishedApps}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {activeSection === 'library' && (
            <MyLibraryView
              user={user}
              userProfile={userProfile}
              apps={publishedApps}
              onSignIn={() => void handleSignIn()}
              onOpenDetail={handleOpenDetail}
              onInstallClick={handleInstallClick}
              onToggleSave={handleToggleSave}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeSection === 'updates' && (
            <UpdatesInfoView
              settings={settings}
              onDownloadStorePro={handleDirectStoreProDownload}
            />
          )}

          {activeSection === 'about' && (
            <AboutUsView
              settings={settings}
              onNavigate={handleNavigate}
              onDownloadStorePro={handleDirectStoreProDownload}
            />
          )}

          {activeSection === 'profile' && (
            <ProfileView
              user={user}
              isAdmin={isAdmin}
              onSignIn={() => void handleSignIn()}
              onSignOut={() => void handleSignOut()}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'app-detail' && selectedApp && (
            <AppDetailView
              app={selectedApp}
              allApps={publishedApps}
              isSaved={savedAppIds.includes(selectedApp.id)}
              isFavorite={favoriteAppIds.includes(selectedApp.id)}
              onToggleSave={handleToggleSave}
              onToggleFavorite={handleToggleFavorite}
              onInstallClick={handleInstallClick}
              onOpenDetail={handleOpenDetail}
              onBack={() => handleNavigate('apps')}
            />
          )}

          {activeSection === 'admin' && user && isAdmin && (
            <AdminDashboard
              user={user}
              apps={adminApps}
              categories={
                adminCategories.length > 0
                  ? adminCategories
                  : (DEFAULT_CATEGORY_SEEDS as WebsiteCategory[])
              }
              banners={adminBanners}
              settings={settings}
              analytics={analytics}
              users={websiteUsers}
              admins={websiteAdmins}
              onBackToStore={() => handleNavigate('home')}
            />
          )}
        </Suspense>

        {activeSection === 'app-detail' && !selectedApp && (
          <div className="sp-rgb-card p-10 text-center space-y-4">
            <p className="text-base font-semibold text-white">
              Application not found or unpublished
            </p>
            <button
              type="button"
              onClick={() => handleNavigate('apps')}
              className="sp-install-btn px-5 py-2.5 text-xs font-bold cursor-pointer"
            >
              Browse All Apps
            </button>
          </div>
        )}

        {activeSection === 'admin' && (!user || !isAdmin) && (
          <div className="sp-rgb-card max-w-lg mx-auto p-8 text-center space-y-4">
            <h2 className="font-display text-xl font-semibold text-white">
              Administrator Authorization Required
            </h2>
            <p className="text-sm text-[#B8BFCE]">
              Only authorized STORE PRO website administrators can access the upload and management console.
            </p>
            {!user && (
              <button
                type="button"
                onClick={() => void handleSignIn()}
                className="sp-install-btn px-5 py-2.5 text-xs font-bold cursor-pointer"
              >
                Sign In with Google
              </button>
            )}
          </div>
        )}
      </main>

      {/* Elegant Elevated Black 3D RGB Footer with Exact Required Description */}
      <footer className="sp-cv-section mt-auto px-4 sm:px-6 pb-24 md:pb-8 pt-6">
        <div className="mx-auto max-w-7xl sp-rgb-card p-7 sm:p-9 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-3">
              <img
                src={footerLogo}
                alt="STORE PRO Official Logo"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-cover border border-white/20"
              />
              <span className="font-display text-base font-bold text-white tracking-tight">
                {settings.websiteName || 'STORE PRO'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#B8BFCE] leading-relaxed">
              {OFFICIAL_FOOTER_DESCRIPTION}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => handleNavigate('updates')}
              className="text-[#B8BFCE] hover:text-white transition cursor-pointer"
            >
              Update Info
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('about')}
              className="text-[#B8BFCE] hover:text-white transition cursor-pointer"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={handleDirectStoreProDownload}
              className="sp-install-btn px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Official STORE PRO APK
            </button>
            {sanitizeExternalUrl(settings.githubUrl) && (
              <a
                href={sanitizeExternalUrl(settings.githubUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00E5FF] hover:underline transition"
              >
                GitHub
              </a>
            )}
          </div>
        </div>
      </footer>

      {(installTargetApp || directStoreProDownload) && (
        <Suspense fallback={null}>
          <InstallWorkflowModal
            app={installTargetApp}
            isDirectStoreProDownload={directStoreProDownload}
            settings={settings}
            onClose={() => {
              setInstallTargetApp(null);
              setDirectStoreProDownload(false);
            }}
            onRedirectTracked={handleRedirectTracked}
          />
        </Suspense>
      )}

      <OfflineIndicator />
    </div>
  );
}
