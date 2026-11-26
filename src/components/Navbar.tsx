import React from 'react';
import { Home, Shield, User } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { GENERATED_MEDIA, sanitizeImageSrc } from '../config/storeProConfig';
import type { NavSection, WebsiteSettings } from '../types/storePro';

interface NavbarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  user: FirebaseUser | null;
  isAdmin: boolean;
  settings: WebsiteSettings;
  onSignIn: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  user,
  isAdmin,
  settings,
  onSignIn,
}) => {
  const logoSrc = sanitizeImageSrc(settings.websiteLogoUrl) || GENERATED_MEDIA.logo9075;

  const desktopLinks: { id: NavSection; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'apps', label: 'All Apps' },
    { id: 'categories', label: 'Categories' },
    { id: 'trending', label: 'Trending' },
    { id: 'top-downloads', label: 'Top Downloads' },
    { id: 'library', label: 'My Library' },
    { id: 'about', label: 'About Us' },
  ];

  const isHomeActive = activeSection === 'home';
  const isProfileActive = activeSection === 'profile' || activeSection === 'admin';

  return (
    <>
      {/* Top Navigation Bar on Light Canvas */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/88 backdrop-blur-md shadow-[0_4px_20px_-8px_rgba(11,13,18,0.12)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Official STORE PRO Logo + Brand Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#287BFF] rounded-xl"
          >
            <img
              src={logoSrc}
              alt="STORE PRO Official Logo"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-cover shadow-md border border-black/15"
            />
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#0B0D12]">
              {settings.websiteName || 'STORE PRO'}
            </span>
          </button>

          {/* Zone 2: Clean Desktop Typography Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-medium"
          >
            {desktopLinks.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-[#0B0D12] text-[#0B0D12] font-semibold'
                      : 'border-transparent text-[#525866] hover:text-[#0B0D12]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Black 3D RGB Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="sp-rgb-btn inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Admin</span>
              </button>
            )}

            {user ? (
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="sp-rgb-btn inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-white/25"
                  />
                ) : (
                  <User className="w-4 h-4 text-[#FFD700]" />
                )}
                <span className="max-w-[96px] truncate">
                  {user.displayName?.split(' ')[0] || 'Profile'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="sp-rgb-btn inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar — STRICTLY ONLY TWO BUTTONS: Home (Left) & Profile (Right) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-3 left-4 right-4 z-40"
      >
        <div className="sp-rgb-dock px-5 py-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="min-h-[46px] min-w-[96px] flex items-center justify-center gap-2.5 rounded-xl px-4 py-2 transition-transform active:scale-95 cursor-pointer"
          >
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isHomeActive
                  ? 'bg-[#171B28] text-[#00E5FF] sp-nav-glow scale-105'
                  : 'text-[#8C93A4]'
              }`}
            >
              <Home className="w-5 h-5" />
            </span>
            <span
              className={`text-xs font-semibold tracking-tight transition-colors ${
                isHomeActive ? 'text-white' : 'text-[#8C93A4]'
              }`}
            >
              Home
            </span>
          </button>

          <div className="h-6 w-px bg-white/10" aria-hidden="true" />

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="min-h-[46px] min-w-[96px] flex items-center justify-center gap-2.5 rounded-xl px-4 py-2 transition-transform active:scale-95 cursor-pointer"
          >
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isProfileActive
                  ? 'bg-[#171B28] text-[#FFD700] sp-nav-glow scale-105'
                  : 'text-[#8C93A4]'
              }`}
            >
              <User className="w-5 h-5" />
            </span>
            <span
              className={`text-xs font-semibold tracking-tight transition-colors ${
                isProfileActive ? 'text-white' : 'text-[#8C93A4]'
              }`}
            >
              Profile
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
