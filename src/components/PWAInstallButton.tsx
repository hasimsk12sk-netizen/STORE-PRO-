import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'banner' }> = ({
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={
          variant === 'banner'
            ? 'sp-rgb-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer'
            : 'sp-rgb-btn inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer'
        }
      >
        <Smartphone className="w-4 h-4 text-[#00E5FF]" />
        <span>Add Web App (PWA)</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="sp-rgb-btn inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Save Web App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="sp-rgb-card w-full max-w-sm p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-display text-white">
                  Install STORE PRO Web App
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close iOS install instructions"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#9BA3B4] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-3 text-sm text-[#B8BFCE] leading-relaxed">
                This installs the STORE PRO website shortcut on your home screen (separate from the Android APK).
              </p>
              <ol className="mt-4 space-y-2 text-sm text-white">
                <li>1. Tap the Share button in Safari toolbar.</li>
                <li>2. Scroll down and tap Add to Home Screen.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="sp-install-btn mt-6 w-full py-2.5 text-sm font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="sp-rgb-dock fixed bottom-22 md:bottom-5 left-4 z-50 flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#FFD700]"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#00E5FF]" />
      <span>Offline Mode — Showing cached STORE PRO catalog</span>
    </div>
  );
};
