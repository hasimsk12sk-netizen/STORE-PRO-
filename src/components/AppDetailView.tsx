import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Check,
  Download,
  HardDrive,
  Heart,
  Layers,
  Package,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { CANONICAL_WEBSITE_URL, sanitizeImageSrc } from '../config/storeProConfig';
import type { WebsiteApp } from '../types/storePro';
import { AppCard, formatCount } from './AppCard';

interface AppDetailViewProps {
  app: WebsiteApp;
  allApps: WebsiteApp[];
  isSaved: boolean;
  isFavorite: boolean;
  onToggleSave: (appId: string) => void;
  onToggleFavorite: (appId: string) => void;
  onInstallClick: (app: WebsiteApp) => void;
  onOpenDetail: (app: WebsiteApp) => void;
  onBack: () => void;
}

export const AppDetailView: React.FC<AppDetailViewProps> = ({
  app,
  allApps,
  isSaved,
  isFavorite,
  onToggleSave,
  onToggleFavorite,
  onInstallClick,
  onOpenDetail,
  onBack,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);

  const safeIcon = sanitizeImageSrc(app.iconUrl);
  const safeScreenshots = useMemo(
    () => app.screenshots.map(sanitizeImageSrc).filter(Boolean),
    [app.screenshots]
  );

  const relatedApps = useMemo(
    () =>
      allApps
        .filter((item) => item.id !== app.id && item.category === app.category)
        .slice(0, 3),
    [allApps, app.id, app.category]
  );

  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${app.name} v${app.version} — STORE PRO`;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') || '';
    if (metaDesc) {
      metaDesc.setAttribute('content', app.shortDescription);
    }

    const scriptId = 'storepro-app-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: app.name,
      url: `${CANONICAL_WEBSITE_URL}?app=${encodeURIComponent(app.id)}`,
      softwareVersion: app.version,
      applicationCategory: app.category,
      operatingSystem: 'Android',
      author: { '@type': 'Organization', name: app.developerName },
      description: app.shortDescription,
      datePublished: app.uploadDate,
      dateModified: app.updatedDate,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    });

    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
      document.getElementById(scriptId)?.remove();
    };
  }, [app]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?app=${encodeURIComponent(app.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${app.name} on STORE PRO`,
          text: app.shortDescription,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-10 pb-28 md:pb-16">
      <button
        type="button"
        onClick={onBack}
        className="sp-rgb-btn inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-[#00E5FF]" />
        <span>Back to Marketplace</span>
      </button>

      {/* Primary App Header Card */}
      <section className="sp-rgb-card sp-rgb-hero p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white/20 bg-[#161924] overflow-hidden shrink-0 flex items-center justify-center shadow-lg">
              {safeIcon && !iconError ? (
                <img
                  src={safeIcon}
                  alt={app.name}
                  referrerPolicy="no-referrer"
                  onError={() => setIconError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-9 h-9 text-[#00E5FF]" />
              )}
            </div>

            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#00E5FF] font-semibold">
                <span>{app.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-[#FFD700]">v{app.version}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#B8BFCE]">{app.size}</span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-bold text-white">
                {app.name}
              </h1>

              <p className="text-sm text-[#9BA3B4] flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-white font-medium">
                  <User className="w-3.5 h-3.5 text-[#00FF66]" />
                  {app.developerName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatCount(app.downloadCount)} install requests</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatCount(app.viewCount)} views</span>
              </p>

              <p className="text-sm text-[#D1D6E0] max-w-2xl pt-1">
                {app.shortDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onInstallClick(app)}
              className="sp-install-btn min-h-[48px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold tracking-wide cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#00FF66]" />
              <span>INSTALL</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(app.id)}
              aria-label="Favorite app"
              className={`sp-rgb-btn min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer ${
                isFavorite ? 'text-[#A020F0]' : 'text-[#9BA3B4]'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current text-[#A020F0]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(app.id)}
              aria-label="Save to My Library"
              className={`sp-rgb-btn min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer ${
                isSaved ? 'text-[#00FF66]' : 'text-[#9BA3B4]'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current text-[#00FF66]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => void handleShare()}
              aria-label="Share application"
              className="sp-rgb-btn min-h-[48px] inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold cursor-pointer"
            >
              {copiedShare ? (
                <>
                  <Check className="w-4 h-4 text-[#00FF66]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#00E5FF]" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Technical Metadata Row */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[#9BA3B4] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#00E5FF]" /> Version
            </span>
            <p className="font-mono text-sm font-medium text-white tabular-nums">
              {app.version}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[#9BA3B4] flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[#00FF66]" /> Size
            </span>
            <p className="font-mono text-sm font-medium text-white tabular-nums">
              {app.size}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[#9BA3B4] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#A020F0]" /> Uploaded
            </span>
            <p className="font-mono text-sm font-medium text-white tabular-nums">
              {app.uploadDate}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[#9BA3B4] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FFD700]" /> Updated
            </span>
            <p className="font-mono text-sm font-medium text-white tabular-nums">
              {app.updatedDate}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/15 bg-[#08090D] px-4 py-3 flex items-center gap-3 text-xs text-[#B8BFCE]">
          <ShieldCheck className="w-4 h-4 text-[#00FF66] shrink-0" />
          <span>
            Centralized distribution: Clicking INSTALL routes through the official STORE PRO Android installer rather than direct third-party APK mirrors.
          </span>
        </div>
      </section>

      {/* Screenshots Gallery */}
      {safeScreenshots.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0B0D12]">
            Screenshots
          </h2>
          <div className="flex gap-5 overflow-x-auto pb-3 no-scrollbar">
            {safeScreenshots.map((src, index) => (
              <button
                key={`${src.slice(0, 32)}-${index}`}
                type="button"
                onClick={() => setLightboxImage(src)}
                className="sp-rgb-card sp-rgb-card-hover shrink-0 w-64 sm:w-80 aspect-[16/10] overflow-hidden p-1 cursor-pointer"
              >
                <img
                  src={src}
                  alt={`${app.name} screenshot ${index + 1}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Full Description, Features & What's New */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 sp-rgb-card p-6 sm:p-7 space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              About {app.name}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#C7CDD8] leading-relaxed whitespace-pre-line">
              {app.fullDescription}
            </p>
          </div>

          {app.whatsNew && (
            <div className="pt-5 border-t border-white/10">
              <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFD700]" />
                <span>What's New</span>
              </h3>
              <p className="mt-2.5 text-sm text-[#B8BFCE] leading-relaxed whitespace-pre-line">
                {app.whatsNew}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 sp-rgb-card p-6 sm:p-7 space-y-4 h-fit">
          <h2 className="font-display text-xl font-semibold text-white">
            Key Features
          </h2>
          {app.features.length > 0 ? (
            <ul className="space-y-3 text-sm text-[#D1D6E0]">
              {app.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#00FF66] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#9BA3B4]">
              Curated application listing managed on STORE PRO.
            </p>
          )}
        </div>
      </section>

      {/* Related Applications */}
      {relatedApps.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0B0D12]">
            Related in {app.category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedApps.map((item) => (
              <AppCard
                key={item.id}
                app={item}
                onOpenDetail={onOpenDetail}
                onInstallClick={onInstallClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Screenshot Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label="Close screenshot preview"
            className="sp-rgb-btn absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt="Screenshot preview"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/20"
          />
        </div>
      )}
    </div>
  );
};
