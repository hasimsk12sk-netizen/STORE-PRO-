import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Clock,
  Download,
  ExternalLink,
  Grid,
  Heart,
  History,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  GENERATED_MEDIA,
  sanitizeExternalUrl,
  STORE_PRO_DEEP_LINK,
  STORE_PRO_DOWNLOAD_URL,
} from '../config/storeProConfig';
import type {
  NavSection,
  WebsiteApp,
  WebsiteCategory,
  WebsiteSettings,
  WebsiteUser,
} from '../types/storePro';
import { AppCard } from './AppCard';
import { SearchBar } from './SearchBar';

interface CatalogProps {
  mode: 'apps' | 'trending' | 'top-downloads';
  apps: WebsiteApp[];
  categories: WebsiteCategory[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSubmitSearch: (q: string) => void;
  searchHistory: string[];
  savedAppIds: string[];
  favoriteAppIds: string[];
  onToggleSave: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenDetail: (app: WebsiteApp) => void;
  onInstallClick: (app: WebsiteApp) => void;
}

export const AppCatalogView: React.FC<CatalogProps> = ({
  mode,
  apps,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchQueryChange,
  onSubmitSearch,
  searchHistory,
  savedAppIds,
  favoriteAppIds,
  onToggleSave,
  onToggleFavorite,
  onOpenDetail,
  onInstallClick,
}) => {
  const [sortBy, setSortBy] = useState<'latest' | 'downloads' | 'views' | 'name'>(
    mode === 'top-downloads' ? 'downloads' : 'latest'
  );

  const displayed = useMemo(() => {
    let list = [...apps];
    if (mode === 'trending') {
      list = list.filter((a) => a.isTrending);
    }
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter((a) => a.category === selectedCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.developerName.toLowerCase().includes(q) ||
          a.shortDescription.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'downloads') return b.downloadCount - a.downloadCount;
      if (sortBy === 'views') return b.viewCount - a.viewCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.updatedDate || '').localeCompare(a.updatedDate || '');
    });
    return list;
  }, [apps, mode, selectedCategory, searchQuery, sortBy]);

  const title =
    mode === 'trending'
      ? 'Trending Applications'
      : mode === 'top-downloads'
      ? 'Top Downloads'
      : 'All Applications';

  const subtitle =
    mode === 'trending'
      ? 'Curated rising listings spotlighted across STORE PRO'
      : mode === 'top-downloads'
      ? 'Ranked by total INSTALL requests routed through STORE PRO'
      : 'Complete directory of manually published website applications';

  return (
    <div className="space-y-8 pb-28 md:pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0D12]">
            {title}
          </h1>
          <p className="text-sm text-[#525866] mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="catalog-sort" className="text-xs font-medium text-[#525866]">
            Sort by
          </label>
          <select
            id="catalog-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-10 rounded-xl bg-[#0B0C11] border border-white/15 px-3 text-xs font-semibold text-white shadow-md focus:outline-none focus:border-[#00E5FF]"
          >
            <option value="latest">Latest Updated</option>
            <option value="downloads">Most Requested</option>
            <option value="views">Most Viewed</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <SearchBar
        query={searchQuery}
        onQueryChange={onSearchQueryChange}
        onSubmitSearch={onSubmitSearch}
        apps={apps}
        categories={categories}
        searchHistory={searchHistory}
        onSelectApp={onOpenDetail}
        onSelectCategory={onSelectCategory}
      />

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => onSelectCategory('All')}
          className={`min-h-[38px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
            selectedCategory === 'All'
              ? 'sp-install-btn'
              : 'border border-black/15 bg-white text-[#1D222E] hover:border-[#287BFF] shadow-sm'
          }`}
        >
          All ({apps.length})
        </button>
        {categories.map((cat) => {
          const count = apps.filter((a) => a.category === cat.name).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className={`min-h-[38px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                selectedCategory === cat.name
                  ? 'sp-install-btn'
                  : 'border border-black/15 bg-white text-[#1D222E] hover:border-[#287BFF] shadow-sm'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {displayed.length === 0 ? (
        <div className="sp-rgb-card p-10 text-center space-y-2">
          <p className="text-base font-semibold text-white">
            No published applications in this view yet
          </p>
          <p className="text-sm text-[#9BA3B4]">
            Try clearing your search or selecting another category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              isSaved={savedAppIds.includes(app.id)}
              isFavorite={favoriteAppIds.includes(app.id)}
              onToggleSave={onToggleSave}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
              onInstallClick={onInstallClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoriesView: React.FC<{
  categories: WebsiteCategory[];
  apps: WebsiteApp[];
  onSelectCategory: (catName: string) => void;
}> = ({ categories, apps, onSelectCategory }) => (
  <div className="space-y-8 pb-28 md:pb-16">
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0D12]">
        Website Categories
      </h1>
      <p className="text-sm text-[#525866] mt-1">
        Browse independently managed STORE PRO website categories
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {categories.map((cat) => {
        const count = apps.filter((a) => a.category === cat.name).length;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.name)}
            className="sp-rgb-card sp-rgb-card-hover text-left p-5 flex items-start justify-between gap-4 cursor-pointer"
          >
            <div className="space-y-1.5 min-w-0">
              <h2 className="font-display text-lg font-semibold text-white">
                {cat.name}
              </h2>
              <p className="text-xs text-[#B8BFCE] line-clamp-2">
                {cat.description}
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#161924] border border-white/15 flex items-center justify-center text-[#00E5FF]">
                <Grid className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs text-[#FFD700] tabular-nums">
                {count} apps
              </span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export const MyLibraryView: React.FC<{
  user: FirebaseUser | null;
  userProfile: WebsiteUser | null;
  apps: WebsiteApp[];
  onSignIn: () => void;
  onOpenDetail: (app: WebsiteApp) => void;
  onInstallClick: (app: WebsiteApp) => void;
  onToggleSave: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}> = ({
  user,
  userProfile,
  apps,
  onSignIn,
  onOpenDetail,
  onInstallClick,
  onToggleSave,
  onToggleFavorite,
}) => {
  const [tab, setTab] = useState<'saved' | 'favorites' | 'history'>('saved');

  if (!user) {
    return (
      <div className="pb-28 md:pb-16">
        <div className="sp-rgb-card max-w-lg mx-auto p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#161924] border border-white/15 flex items-center justify-center text-[#00E5FF]">
            <Bookmark className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Your STORE PRO Library
          </h1>
          <p className="text-sm text-[#B8BFCE] leading-relaxed">
            Sign in with Google to sync saved applications, favorites, and browsing history across your devices.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="sp-install-btn min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold cursor-pointer"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  const savedIds = userProfile?.savedAppIds || [];
  const favIds = userProfile?.favoriteAppIds || [];
  const historyIds = userProfile?.browsingHistory || [];

  const activeIds =
    tab === 'saved' ? savedIds : tab === 'favorites' ? favIds : historyIds;

  const listApps = activeIds
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is WebsiteApp => Boolean(a));

  return (
    <div className="space-y-8 pb-28 md:pb-16">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0D12]">
          My Library
        </h1>
        <p className="text-sm text-[#525866] mt-1">
          Personal saved applications, favorites, and website browsing history
        </p>
      </div>

      <div className="sp-rgb-dock inline-flex items-center gap-1 p-2">
        <button
          type="button"
          onClick={() => setTab('saved')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition ${
            tab === 'saved'
              ? 'bg-[#1F2433] text-[#00FF66] border border-white/15'
              : 'text-[#9BA3B4] hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved ({savedIds.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('favorites')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition ${
            tab === 'favorites'
              ? 'bg-[#1F2433] text-[#A020F0] border border-white/15'
              : 'text-[#9BA3B4] hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Favorites ({favIds.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition ${
            tab === 'history'
              ? 'bg-[#1F2433] text-[#00E5FF] border border-white/15'
              : 'text-[#9BA3B4] hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History ({historyIds.length})</span>
        </button>
      </div>

      {listApps.length === 0 ? (
        <div className="sp-rgb-card p-10 text-center text-sm text-[#9BA3B4]">
          No applications recorded in this section yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              isSaved={savedIds.includes(app.id)}
              isFavorite={favIds.includes(app.id)}
              onToggleSave={onToggleSave}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
              onInstallClick={onInstallClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const UpdatesInfoView: React.FC<{
  settings: WebsiteSettings;
  onDownloadStorePro: () => void;
}> = ({ settings, onDownloadStorePro }) => (
  <div className="space-y-8 pb-28 md:pb-16">
    <div className="sp-rgb-card sp-rgb-hero overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
        <p className="text-xs font-semibold text-[#00E5FF]">
          Live STORE PRO Update Information
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          STORE PRO v{settings.latestStoreProVersion}
        </h1>
        <p className="text-sm text-[#FFD700] font-semibold">
          {settings.latestStoreProVersionName} · Released {settings.latestReleaseDate}
        </p>
        <p className="text-sm sm:text-base text-[#D1D6E0] leading-relaxed whitespace-pre-line">
          {settings.latestReleaseNotes}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onDownloadStorePro}
            className="sp-install-btn min-h-[46px] inline-flex items-center gap-2 px-6 py-3 text-sm font-bold cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#00FF66]" />
            <span>Download Official STORE PRO APK</span>
          </button>
          <a
            href={STORE_PRO_DEEP_LINK}
            className="sp-rgb-btn min-h-[46px] inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
          >
            <ExternalLink className="w-4 h-4 text-[#00E5FF]" />
            <span>Open Installed App</span>
          </a>
        </div>
      </div>

      <div className="lg:col-span-5 relative min-h-[240px] bg-[#08090D]">
        <img
          src={GENERATED_MEDIA.appManagement}
          alt="STORE PRO release channel"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#090A0F] via-[#090A0F]/25 to-transparent" />
      </div>
    </div>

    <section className="sp-rgb-card p-6 sm:p-8 space-y-5">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#00E5FF]" />
        <h2 className="font-display text-xl font-semibold text-white">
          Update History
        </h2>
      </div>

      <div className="divide-y divide-white/10">
        {settings.updateHistory.map((entry, idx) => {
          const [ver, codename, notes, date] = entry.split('|').map((s) => s.trim());
          return (
            <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  <span className="font-mono text-[#FFD700]">{ver || entry}</span>
                  {codename ? ` · ${codename}` : ''}
                </p>
                {notes && <p className="text-xs sm:text-sm text-[#B8BFCE]">{notes}</p>}
              </div>
              {date && (
                <span className="font-mono text-xs text-[#9BA3B4] tabular-nums shrink-0">
                  {date}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  </div>
);

export const AboutUsView: React.FC<{
  settings: WebsiteSettings;
  onNavigate: (section: NavSection) => void;
  onDownloadStorePro: () => void;
}> = ({ settings, onNavigate, onDownloadStorePro }) => (
  <div className="space-y-8 pb-28 md:pb-16">
    <section className="sp-rgb-card p-6 sm:p-10 space-y-4">
      <div className="flex items-center gap-3">
        <img
          src={GENERATED_MEDIA.logo9075}
          alt="STORE PRO"
          referrerPolicy="no-referrer"
          className="w-11 h-11 rounded-xl object-cover border border-white/20"
        />
        <p className="text-xs font-semibold text-[#00E5FF]">Platform Architecture</p>
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
        About {settings.websiteName}
      </h1>
      <p className="text-sm sm:text-base text-[#D1D6E0] max-w-3xl leading-relaxed">
        {settings.websiteDescription}
      </p>
    </section>

    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="sp-rgb-card sp-rgb-card-hover p-6 space-y-2.5">
        <ShieldCheck className="w-6 h-6 text-[#00FF66]" />
        <h2 className="font-display text-lg font-semibold text-white">
          Complete Platform Isolation
        </h2>
        <p className="text-sm text-[#B8BFCE] leading-relaxed">
          The STORE PRO Website and the STORE PRO Android Application run independent databases and administration tools without cross-publishing.
        </p>
      </div>

      <div className="sp-rgb-card sp-rgb-card-hover p-6 space-y-2.5">
        <Smartphone className="w-6 h-6 text-[#00E5FF]" />
        <h2 className="font-display text-lg font-semibold text-white">
          Centralized Official Installer
        </h2>
        <p className="text-sm text-[#B8BFCE] leading-relaxed">
          Third-party APKs are never hosted on this website. Every INSTALL button connects exclusively to the centralized STORE PRO Android client.
        </p>
      </div>

      <div className="sp-rgb-card sp-rgb-card-hover p-6 space-y-2.5">
        <Sparkles className="w-6 h-6 text-[#FFD700]" />
        <h2 className="font-display text-lg font-semibold text-white">
          Deep-Link Integration
        </h2>
        <p className="text-sm text-[#B8BFCE] leading-relaxed">
          Android visitors with STORE PRO installed can transition directly via{' '}
          <a
            href={STORE_PRO_DEEP_LINK}
            className="font-mono text-[#00E5FF] hover:underline"
          >
            storepro://home
          </a>{' '}
          or download the latest official release at{' '}
          <a
            href={sanitizeExternalUrl(settings.storeProDownloadUrl) || STORE_PRO_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs sm:text-sm text-[#00FF66] hover:text-[#FFD700] underline break-all transition-colors"
          >
            {sanitizeExternalUrl(settings.storeProDownloadUrl) || STORE_PRO_DOWNLOAD_URL}
          </a>
          .
        </p>
      </div>
    </section>

    <section className="sp-rgb-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-white">
          Contact & Official Links
        </h2>
        <p className="text-sm text-[#B8BFCE] flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#FFD700]" />
          <span>
            {!settings.contactEmail || settings.contactEmail === 'support@storepro.app'
              ? 'hasimsk12sk@gmail.com'
              : settings.contactEmail}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {sanitizeExternalUrl(settings.githubUrl) && (
          <a
            href={sanitizeExternalUrl(settings.githubUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="sp-rgb-btn px-4 py-2 text-xs font-semibold"
          >
            GitHub Releases
          </a>
        )}
        <button
          type="button"
          onClick={() => onNavigate('updates')}
          className="sp-rgb-btn px-4 py-2 text-xs font-semibold cursor-pointer"
        >
          Update Info
        </button>
        <button
          type="button"
          onClick={onDownloadStorePro}
          className="sp-install-btn px-4 py-2 text-xs font-bold cursor-pointer"
        >
          Download STORE PRO
        </button>
      </div>
    </section>
  </div>
);

export const ProfileView: React.FC<{
  user: FirebaseUser | null;
  userProfile?: WebsiteUser | null;
  isAdmin: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onUpdatePrefs?: (prefs: { notificationsEnabled?: boolean; compactMode?: boolean }) => void;
  onNavigate: (section: NavSection) => void;
}> = ({
  user,
  isAdmin,
  onSignIn,
  onSignOut,
  onNavigate,
}) => {
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto pt-2 pb-28 md:pb-16">
        <section className="sp-rgb-card sp-rgb-hero p-5 sm:p-8">
          <div className="sp-card-recessed rounded-2xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#161924] border border-white/20 overflow-hidden shadow-lg">
              <img
                src={GENERATED_MEDIA.logo9075}
                alt="STORE PRO"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-white">
                STORE PRO Account
              </h1>
              <p className="text-sm text-[#B8BFCE] leading-relaxed">
                Sign in with Google to view your STORE PRO Website Member profile and manage your session.
              </p>
            </div>
            <button
              type="button"
              onClick={onSignIn}
              className="sp-install-btn min-h-[46px] w-full px-6 py-3 text-sm font-bold cursor-pointer"
            >
              Continue with Google
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-2 pb-28 md:pb-16">
      <section className="sp-rgb-card sp-rgb-hero p-5 sm:p-8">
        <div className="sp-card-recessed rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border border-white/25 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#161924] border border-white/15 flex items-center justify-center text-[#00E5FF] shrink-0">
                <UserIcon className="w-7 h-7" />
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white truncate">
                {user.displayName || 'STORE PRO Member'}
              </h1>
              <p className="text-sm text-[#B8BFCE] truncate">{user.email}</p>
              <p className="text-xs font-semibold text-[#00FF66]">
                {isAdmin ? 'Authorized Website Administrator' : 'Website Member'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="sp-install-btn min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[#00E5FF]" />
                <span>Admin Dashboard</span>
              </button>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="sp-rgb-btn min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#A020F0]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
