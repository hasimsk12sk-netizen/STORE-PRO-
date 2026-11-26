import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_BANNER_SEEDS,
  GENERATED_MEDIA,
  sanitizeImageSrc,
  STORE_PRO_TELEGRAM_URL,
  STORE_PRO_WHATSAPP_URL,
} from '../config/storeProConfig';
import type {
  NavSection,
  WebsiteApp,
  WebsiteBanner,
  WebsiteCategory,
  WebsiteSettings,
} from '../types/storePro';
import { AppCard } from './AppCard';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeViewProps {
  apps: WebsiteApp[];
  categories: WebsiteCategory[];
  banners: WebsiteBanner[];
  settings: WebsiteSettings;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSubmitSearch: (q: string) => void;
  searchHistory: string[];
  savedAppIds: string[];
  favoriteAppIds: string[];
  onToggleSave: (appId: string) => void;
  onToggleFavorite: (appId: string) => void;
  onOpenDetail: (app: WebsiteApp) => void;
  onInstallClick: (app: WebsiteApp) => void;
  onDownloadStorePro: () => void;
  onNavigate: (section: NavSection) => void;
  onSelectCategory: (categoryName: string) => void;
  isAdmin: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  apps,
  banners,
  settings,
  savedAppIds,
  favoriteAppIds,
  onToggleSave,
  onToggleFavorite,
  onOpenDetail,
  onInstallClick,
  onDownloadStorePro,
  onNavigate,
}) => {
  const activeBanners = useMemo(
    () => (banners.length > 0 ? banners : (DEFAULT_BANNER_SEEDS as WebsiteBanner[])),
    [banners]
  );
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let timer: number | null = null;

    const startTimer = () => {
      if (timer !== null || document.hidden) return;
      timer = window.setInterval(() => {
        setBannerIndex((prev) => (prev + 1) % activeBanners.length);
      }, 6500);
    };

    const stopTimer = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [activeBanners.length]);

  const currentBanner = activeBanners[bannerIndex % activeBanners.length] || activeBanners[0];
  const bannerImg =
    sanitizeImageSrc(currentBanner?.imageUrl || '') || GENERATED_MEDIA.banner9076;

  const featuredApps = useMemo(
    () => apps.filter((a) => a.isFeatured).slice(0, 6),
    [apps]
  );
  const trendingApps = useMemo(
    () => apps.filter((a) => a.isTrending).slice(0, 6),
    [apps]
  );
  const popularApps = useMemo(
    () => apps.filter((a) => a.isPopular).slice(0, 6),
    [apps]
  );
  const topDownloads = useMemo(
    () => [...apps].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 6),
    [apps]
  );
  const recentUploads = useMemo(
    () =>
      [...apps]
        .sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || ''))
        .slice(0, 6),
    [apps]
  );

  const handleBannerAction = () => {
    if (currentBanner.targetAppId) {
      const target = apps.find((a) => a.id === currentBanner.targetAppId);
      if (target) {
        onOpenDetail(target);
        return;
      }
    }
    const route = currentBanner.targetRoute as NavSection;
    if (
      route === 'apps' ||
      route === 'categories' ||
      route === 'trending' ||
      route === 'top-downloads' ||
      route === 'updates' ||
      route === 'about'
    ) {
      onNavigate(route);
    } else {
      onNavigate('apps');
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-28 md:pb-16">
      {/* 1. Official STORE PRO Hero Banner */}
      <section className="sp-rgb-card sp-rgb-hero overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
          {/* Left Copy & Official CTAs */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <img
                  src={sanitizeImageSrc(settings.websiteLogoUrl) || GENERATED_MEDIA.logo9075}
                  alt="STORE PRO Emblem"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-md"
                />
                <span className="text-xs font-semibold text-[#00E5FF]">
                  STORE PRO Official Hub · v{settings.latestStoreProVersion}
                </span>
              </div>

              <h1
                className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {currentBanner.title}
              </h1>

              <p className="text-sm sm:text-base text-[#B8BFCE] leading-relaxed">
                {currentBanner.subtitle}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onDownloadStorePro}
                  className="sp-install-btn min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#00FF66]" />
                  <span>Get STORE PRO APK</span>
                </button>

                <button
                  type="button"
                  onClick={handleBannerAction}
                  className="sp-rgb-btn min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold cursor-pointer"
                >
                  <span>{currentBanner.ctaLabel || 'Explore Catalog'}</span>
                  <ArrowRight className="w-4 h-4 text-[#00E5FF]" />
                </button>

                <PWAInstallButton variant="banner" />
              </div>

              {/* Social Community Buttons: Join WhatsApp + Join Telegram */}
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 w-full">
                <a
                  href={STORE_PRO_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join WhatsApp"
                  className="sp-social-btn min-h-[54px] w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
                >
                  <span className="sp-social-logo-wrap sp-social-logo-whatsapp">
                    <WhatsAppOfficialLogo />
                  </span>
                  <span>Join WhatsApp</span>
                </a>

                <a
                  href={STORE_PRO_TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join Telegram"
                  className="sp-social-btn min-h-[54px] w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
                >
                  <span className="sp-social-logo-wrap sp-social-logo-telegram">
                    <TelegramOfficialLogo />
                  </span>
                  <span>Join Telegram</span>
                </a>
              </div>

              {activeBanners.length > 1 && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setBannerIndex(
                        (prev) => (prev - 1 + activeBanners.length) % activeBanners.length
                      )
                    }
                    aria-label="Previous banner"
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-white/15 text-[#9BA3B4] hover:text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {activeBanners.map((b, idx) => (
                      <button
                        key={b.id || idx}
                        type="button"
                        onClick={() => setBannerIndex(idx)}
                        aria-label={`Show banner ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === bannerIndex
                            ? 'w-7 bg-gradient-to-r from-[#00FF66] via-[#00E5FF] to-[#FFD700]'
                            : 'w-2 bg-white/25 hover:bg-white/45'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setBannerIndex((prev) => (prev + 1) % activeBanners.length)
                    }
                    aria-label="Next banner"
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-white/15 text-[#9BA3B4] hover:text-white cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Official Landscape Banner (9076) */}
          <div className="lg:col-span-7">
            <div className="sp-card-recessed relative aspect-[16/9] w-full rounded-2xl overflow-hidden">
              <img
                src={bannerImg}
                alt={currentBanner.title}
                fetchPriority="high"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain sm:object-cover transition-opacity duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Large STORE PRO Description Section */}
      <section
        aria-label="About STORE PRO"
        className="sp-cv-section sp-rgb-card sp-rgb-hero p-5 sm:p-7 lg:p-9"
      >
        <div className="sp-card-recessed rounded-2xl p-6 sm:p-8 lg:p-10 space-y-5">
          <div className="space-y-3">
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-[2rem] font-bold tracking-tight text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Welcome to <span className="text-[#00FF66]">STORE PRO</span> — Your{' '}
              <span className="text-[#00E5FF]">Premium</span>{' '}
              <span className="text-[#FFD700]">Android App</span> Destination
            </h2>
            <div
              aria-hidden="true"
              className="h-[2px] w-28 sm:w-40 rounded-full bg-gradient-to-r from-[#00FF66] via-[#00E5FF] via-[#A020F0] to-[#FFD700]"
            />
          </div>

          <div className="space-y-4 text-sm sm:text-base text-[#D1D6E0] leading-relaxed sm:leading-7">
            <p>
              Discover a smarter way to explore the world of Android applications with STORE PRO. Explore a curated collection of mobile applications, discover exciting digital tools, and stay informed about the latest app releases. STORE PRO brings application discovery, premium digital experiences, and modern technology together in one convenient destination. Whether you are looking for productivity tools, entertainment applications, creative editors, communication platforms, or useful everyday utilities, STORE PRO makes discovering your next favorite application simple and enjoyable.
            </p>
            <p>
              Experience a modern application marketplace designed with a premium interface, organized collections, detailed application information, and a convenient installation experience powered by the official STORE PRO Android application. Explore, discover, and enjoy the world of Android applications with STORE PRO.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Three Image-Only Showcase Cards */}
      <section aria-label="STORE PRO Visual Showcase" className="sp-cv-section">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <ImageOnlyShowcaseCard
            image={GENERATED_MEDIA.androidCollection}
            alt="STORE PRO Smartphone App Collections"
          />
          <ImageOnlyShowcaseCard
            image={GENERATED_MEDIA.appDiscovery}
            alt="STORE PRO App Discovery Showcase"
          />
          <ImageOnlyShowcaseCard
            image={GENERATED_MEDIA.appManagement}
            alt="STORE PRO Application Delivery Bridge"
          />
        </div>
      </section>

      {/* Published Website Applications (rendered when admin has published listings) */}
      {apps.length > 0 && (
        <div className="sp-cv-section space-y-10">
          {featuredApps.length > 0 && (
            <SectionGrid
              title="Featured Applications"
              subtitle="Handpicked listings spotlighted for the STORE PRO web hub"
              apps={featuredApps}
              onSeeAll={() => onNavigate('apps')}
              savedAppIds={savedAppIds}
              favoriteAppIds={favoriteAppIds}
              onToggleSave={onToggleSave}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
              onInstallClick={onInstallClick}
            />
          )}

          {trendingApps.length > 0 && (
            <SectionGrid
              title="Trending Now"
              subtitle="High-momentum Android releases discovered across the marketplace"
              apps={trendingApps}
              onSeeAll={() => onNavigate('trending')}
              savedAppIds={savedAppIds}
              favoriteAppIds={favoriteAppIds}
              onToggleSave={onToggleSave}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
              onInstallClick={onInstallClick}
            />
          )}

          {popularApps.length > 0 && (
            <SectionGrid
              title="Popular Apps"
              subtitle="Community favorites with strong installer engagement"
              apps={popularApps}
              onSeeAll={() => onNavigate('apps')}
              savedAppIds={savedAppIds}
              favoriteAppIds={favoriteAppIds}
              onToggleSave={onToggleSave}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
              onInstallClick={onInstallClick}
            />
          )}

          <SectionGrid
            title="Top Downloads"
            subtitle="Most requested applications routed through STORE PRO"
            apps={topDownloads}
            onSeeAll={() => onNavigate('top-downloads')}
            savedAppIds={savedAppIds}
            favoriteAppIds={favoriteAppIds}
            onToggleSave={onToggleSave}
            onToggleFavorite={onToggleFavorite}
            onOpenDetail={onOpenDetail}
            onInstallClick={onInstallClick}
          />

          <SectionGrid
            title="Recent Uploads & Latest Releases"
            subtitle="Newly published website listings managed by STORE PRO"
            apps={recentUploads}
            onSeeAll={() => onNavigate('apps')}
            savedAppIds={savedAppIds}
            favoriteAppIds={favoriteAppIds}
            onToggleSave={onToggleSave}
            onToggleFavorite={onToggleFavorite}
            onOpenDetail={onOpenDetail}
            onInstallClick={onInstallClick}
          />
        </div>
      )}

      {/* 4. Existing STORE PRO Release Information Section */}
      <section className="sp-cv-section sp-rgb-card p-7 sm:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00E5FF]">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>STORE PRO Android Client · v{settings.latestStoreProVersion}</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-white">
            {settings.latestStoreProVersionName || 'Official STORE PRO Release'}
          </h2>
          <p className="text-sm text-[#B8BFCE] max-w-2xl">
            {settings.latestReleaseNotes}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('updates')}
            className="sp-rgb-btn min-h-[44px] px-4 py-2.5 text-sm font-semibold cursor-pointer"
          >
            Release History
          </button>
          <button
            type="button"
            onClick={onDownloadStorePro}
            className="sp-install-btn min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#00FF66]" />
            <span>Download APK</span>
          </button>
        </div>
      </section>
    </div>
  );
};

const ImageOnlyShowcaseCard: React.FC<{
  image: string;
  alt: string;
}> = React.memo(({ image, alt }) => (
  <div className="sp-rgb-card sp-rgb-card-hover p-4 sm:p-5 overflow-hidden">
    <div className="sp-card-recessed aspect-[4/3] w-full overflow-hidden rounded-xl">
      <img
        src={image}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
      />
    </div>
  </div>
));

interface SectionGridProps {
  title: string;
  subtitle: string;
  apps: WebsiteApp[];
  onSeeAll: () => void;
  savedAppIds: string[];
  favoriteAppIds: string[];
  onToggleSave: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenDetail: (app: WebsiteApp) => void;
  onInstallClick: (app: WebsiteApp) => void;
}

const SectionGrid: React.FC<SectionGridProps> = React.memo(({
  title,
  subtitle,
  apps,
  onSeeAll,
  savedAppIds,
  favoriteAppIds,
  onToggleSave,
  onToggleFavorite,
  onOpenDetail,
  onInstallClick,
}) => (
  <section className="space-y-5">
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B0D12]">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-[#525866] mt-0.5">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onSeeAll}
        className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#0B0D12] hover:text-[#287BFF] whitespace-nowrap shrink-0 cursor-pointer"
      >
        <span>View all</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {apps.map((app) => (
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
  </section>
));

const WhatsAppOfficialLogo: React.FC = () => (
  <svg
    viewBox="0 0 32 32"
    aria-hidden="true"
    className="w-full h-full rounded-full"
  >
    <circle cx="16" cy="16" r="16" fill="#25D366" />
    <path
      fill="#FFFFFF"
      d="M16.02 7.2c-4.82 0-8.74 3.9-8.74 8.71 0 1.66.47 3.28 1.36 4.68L7.5 24.8l4.34-1.14a8.76 8.76 0 0 0 4.18 1.06h.01c4.81 0 8.73-3.9 8.73-8.71 0-2.33-.91-4.52-2.56-6.17a8.68 8.68 0 0 0-6.18-2.64Zm5.11 12.39c-.22.61-1.26 1.16-1.74 1.23-.45.07-1.01.1-1.63-.1-.38-.12-.86-.28-1.48-.55-2.6-1.12-4.3-3.74-4.43-3.92-.13-.17-1.06-1.4-1.06-2.68s.67-1.9.91-2.16c.24-.26.52-.32.69-.32.17 0 .35 0 .5.01.16.01.38-.06.59.45.22.52.74 1.8.8 1.93.07.13.11.29.02.46-.09.17-.13.28-.26.43-.13.15-.27.34-.39.46-.13.13-.26.27-.11.53.15.26.67 1.1 1.44 1.79.99.88 1.82 1.15 2.08 1.28.26.13.41.11.56-.06.15-.17.65-.76.82-1.02.17-.26.35-.22.59-.13.24.09 1.52.72 1.78.85.26.13.43.19.5.3.06.11.06.63-.16 1.24Z"
    />
  </svg>
);

const TelegramOfficialLogo: React.FC = () => (
  <svg
    viewBox="0 0 32 32"
    aria-hidden="true"
    className="w-full h-full rounded-full"
  >
    <circle cx="16" cy="16" r="16" fill="#229ED9" />
    <path
      fill="#FFFFFF"
      d="m22.97 9.95-2.46 11.62c-.18.83-.67 1.03-1.36.64l-3.76-2.77-1.81 1.74c-.2.2-.37.37-.76.37l.27-3.83 6.97-6.3c.3-.27-.07-.42-.47-.15l-8.61 5.42-3.71-1.16c-.81-.25-.82-.81.17-1.2l14.5-5.59c.67-.25 1.26.15 1.03 1.21Z"
    />
  </svg>
);
