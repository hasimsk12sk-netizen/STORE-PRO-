import React, { memo, useState } from 'react';
import { Bookmark, Download, Heart, Package } from 'lucide-react';
import { sanitizeImageSrc } from '../config/storeProConfig';
import type { WebsiteApp } from '../types/storePro';

interface AppCardProps {
  app: WebsiteApp;
  onOpenDetail: (app: WebsiteApp) => void;
  onInstallClick: (app: WebsiteApp) => void;
  isSaved?: boolean;
  isFavorite?: boolean;
  onToggleSave?: (appId: string) => void;
  onToggleFavorite?: (appId: string) => void;
  compact?: boolean;
}

export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

const AppCardComponent: React.FC<AppCardProps> = ({
  app,
  onOpenDetail,
  onInstallClick,
  isSaved = false,
  isFavorite = false,
  onToggleSave,
  onToggleFavorite,
  compact = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const safeIcon = sanitizeImageSrc(app.iconUrl);

  return (
    <article className="group sp-rgb-card sp-rgb-card-hover p-5 sm:p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={() => onOpenDetail(app)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#161924] border border-white/15 overflow-hidden shrink-0 flex items-center justify-center shadow-lg cursor-pointer"
          >
            {safeIcon && !imgError ? (
              <img
                src={safeIcon}
                alt={`${app.name} icon`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1C2130] to-[#0D0F16] flex items-center justify-center text-[#00E5FF]">
                <Package className="w-6 h-6" />
              </div>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onOpenDetail(app)}
              className="text-left w-full cursor-pointer"
            >
              <h3 className="font-display text-base sm:text-lg font-semibold text-white group-hover:text-[#00E5FF] transition-colors truncate">
                {app.name}
              </h3>
            </button>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#9BA3B4]">
              <span>{app.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[#FFD700]">
                v{app.version}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatCount(app.downloadCount)} clicks</span>
            </div>
          </div>

          {(onToggleSave || onToggleFavorite) && (
            <div className="flex items-center gap-1 shrink-0">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(app.id)}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition cursor-pointer ${
                    isFavorite
                      ? 'text-[#A020F0] bg-[#A020F0]/20'
                      : 'text-[#8C93A4] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
              {onToggleSave && (
                <button
                  type="button"
                  onClick={() => onToggleSave(app.id)}
                  aria-label={isSaved ? 'Remove from saved library' : 'Save to library'}
                  className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition cursor-pointer ${
                    isSaved
                      ? 'text-[#00FF66] bg-[#00FF66]/15'
                      : 'text-[#8C93A4] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div>

        {!compact && (
          <button
            type="button"
            onClick={() => onOpenDetail(app)}
            className="mt-3 text-left w-full cursor-pointer"
          >
            <p className="text-sm text-[#B8BFCE] leading-relaxed line-clamp-2">
              {app.shortDescription}
            </p>
          </button>
        )}
      </div>

      <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenDetail(app)}
          className="text-xs font-medium text-[#9BA3B4] hover:text-white transition truncate cursor-pointer"
        >
          {app.developerName} · {app.size}
        </button>

        <button
          type="button"
          onClick={() => onInstallClick(app)}
          className="sp-install-btn min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wide whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#00FF66]" />
          <span>INSTALL</span>
        </button>
      </div>
    </article>
  );
};

export const AppCard = memo(AppCardComponent);
