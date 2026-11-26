import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Search,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import {
  GENERATED_MEDIA,
  sanitizeExternalUrl,
  STORE_PRO_DEEP_LINK,
  STORE_PRO_DOWNLOAD_URL,
} from '../config/storeProConfig';
import type { WebsiteApp, WebsiteSettings } from '../types/storePro';

interface InstallWorkflowModalProps {
  app: WebsiteApp | null;
  isDirectStoreProDownload?: boolean;
  settings: WebsiteSettings;
  onClose: () => void;
  onRedirectTracked: (app: WebsiteApp | null) => void;
}

type DeepLinkStage = 'checking' | 'not-detected' | 'opened';

export const InstallWorkflowModal: React.FC<InstallWorkflowModalProps> = ({
  app,
  isDirectStoreProDownload = false,
  settings,
  onClose,
  onRedirectTracked,
}) => {
  const [stage, setStage] = useState<DeepLinkStage>('checking');
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState<number | null>(null);

  const downloadUrl =
    sanitizeExternalUrl(settings.storeProDownloadUrl) || STORE_PRO_DOWNLOAD_URL;

  const isAndroid =
    typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  useEffect(() => {
    if (!app && !isDirectStoreProDownload) return;

    if (isDirectStoreProDownload) {
      setStage('not-detected');
      setAutoRedirectSeconds(null);
      return;
    }

    setStage('checking');
    setAutoRedirectSeconds(null);

    let appOpened = false;
    const handleVisibility = () => {
      if (document.hidden) {
        appOpened = true;
        setStage('opened');
        setAutoRedirectSeconds(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    if (isAndroid) {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = STORE_PRO_DEEP_LINK;
        document.body.appendChild(iframe);
        setTimeout(() => {
          iframe.remove();
        }, 1000);
      } catch {
        // Fallback handled below
      }
    }

    const timer = window.setTimeout(() => {
      if (!appOpened) {
        setStage('not-detected');
        if (isAndroid) {
          setAutoRedirectSeconds(4);
        }
      }
    }, 1300);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearTimeout(timer);
    };
  }, [app, isDirectStoreProDownload, isAndroid]);

  useEffect(() => {
    if (autoRedirectSeconds === null) return;
    if (autoRedirectSeconds <= 0) {
      onRedirectTracked(app);
      window.location.assign(downloadUrl);
      setAutoRedirectSeconds(null);
      return;
    }
    const tick = window.setTimeout(() => {
      setAutoRedirectSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => window.clearTimeout(tick);
  }, [autoRedirectSeconds, app, downloadUrl, onRedirectTracked]);

  if (!app && !isDirectStoreProDownload) return null;

  const handleManualOpenDeepLink = () => {
    setAutoRedirectSeconds(null);
    window.location.href = STORE_PRO_DEEP_LINK;
  };

  const handleDownloadApk = () => {
    setAutoRedirectSeconds(null);
    onRedirectTracked(app);
    window.location.assign(downloadUrl);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-workflow-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="sp-rgb-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#161924] border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
              {app?.iconUrl ? (
                <img
                  src={app.iconUrl}
                  alt={app.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={GENERATED_MEDIA.logo9075}
                  alt="STORE PRO"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#00E5FF]">
                Official STORE PRO Installer
              </p>
              <h2
                id="install-workflow-title"
                className="text-lg sm:text-xl font-semibold font-display text-white truncate"
              >
                {app ? `Install ${app.name}` : 'Download Official STORE PRO APK'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setAutoRedirectSeconds(null);
              onClose();
            }}
            aria-label="Close installation dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#9BA3B4] hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Clear Message */}
        <div className="mt-5 rounded-xl border border-white/15 bg-[#141722] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00FF66] shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-sm">
              <p className="font-medium text-white">
                STORE PRO is required to access and install applications. Please install STORE PRO first, then open the app to continue.
              </p>
              {app && (
                <p className="text-xs text-[#B8BFCE] leading-relaxed">
                  STORE PRO Website and the STORE PRO Android app operate independent catalogs. After opening STORE PRO, search for{' '}
                  <span className="text-white font-semibold">"{app.name}"</span> manually inside the Android app if it is not shown automatically.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Deep Link Detection Status */}
        <div className="mt-4 rounded-xl border border-white/10 bg-[#08090D] p-4 text-sm">
          {stage === 'checking' && (
            <div className="flex items-center gap-3 text-[#B8BFCE]">
              <div className="w-4 h-4 rounded-full border-2 border-[#00E5FF] border-t-transparent animate-spin shrink-0" />
              <span>Checking for STORE PRO Android app ({STORE_PRO_DEEP_LINK})...</span>
            </div>
          )}

          {stage === 'opened' && (
            <div className="flex items-center gap-3 text-[#00FF66]">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>STORE PRO opened on your device. Search manually inside the app to explore.</span>
            </div>
          )}

          {stage === 'not-detected' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 text-[#FFD700]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm">
                  {isAndroid
                    ? 'STORE PRO app was not detected automatically. Install the official STORE PRO APK or open the app if already installed.'
                    : 'Viewing on desktop or non-Android browser. Download the official STORE PRO APK to transfer to your Android device.'}
                </span>
              </div>
              {autoRedirectSeconds !== null && (
                <div className="flex items-center justify-between pt-1 text-xs text-[#9BA3B4]">
                  <span className="tabular-nums">
                    Redirecting to official STORE PRO APK in {autoRedirectSeconds}s...
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoRedirectSeconds(null)}
                    className="text-[#00E5FF] underline hover:no-underline cursor-pointer"
                  >
                    Cancel auto-redirect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDownloadApk}
            className="sp-install-btn flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#00FF66]" />
            <span>Download STORE PRO APK</span>
          </button>

          {!isDirectStoreProDownload && (
            <button
              type="button"
              onClick={handleManualOpenDeepLink}
              className="sp-rgb-btn min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-[#00E5FF]" />
              <span>Open STORE PRO</span>
            </button>
          )}
        </div>

        {/* Centralized Source Disclosure */}
        <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs text-[#9BA3B4]">
          <span className="flex items-center gap-1.5 truncate">
            <Search className="w-3.5 h-3.5 shrink-0 text-[#00E5FF]" />
            <span className="truncate">
              Release v{settings.latestStoreProVersion} · Official STORE PRO channel
            </span>
          </span>
          <span className="font-mono text-[11px] text-[#9BA3B4] shrink-0 flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-[#FFD700]" />
            storepro://home
          </span>
        </div>
      </div>
    </div>
  );
};
