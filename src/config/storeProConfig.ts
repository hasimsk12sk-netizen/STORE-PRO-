import type { WebsiteBanner, WebsiteCategory, WebsiteSettings } from '../types/storePro';

/**
 * Centralized official STORE PRO Android APK download URL.
 * Every website application's INSTALL button dynamically routes through this centralized configuration.
 */
export const STORE_PRO_DOWNLOAD_URL =
  'https://github.com/hasim121/STORE-PRO-APK-NEW/releases/latest/download/STORE.PRO.apk';

export const STORE_PRO_DEEP_LINK = 'storepro://home';

export const STORE_PRO_WHATSAPP_URL =
  'https://chat.whatsapp.com/KZPB5BRZNpJ1wNIL3JawJ8?s=cl&p=a&iam=2';

export const STORE_PRO_TELEGRAM_URL = 'https://t.me/hasimapk';

export const CANONICAL_WEBSITE_URL =
  'https://store-pro-independent-app-marketplace.ai.studio/';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'hasimsk12sk@gmail.com';

export const GENERATED_MEDIA = {
  logo9075: '/src/assets/images/storepro_logo_9075_1795630353525.jpg',
  banner9076: '/src/assets/images/storepro_banner_9076_1795630354889.jpg',
  androidCollection: '/src/assets/images/showcase_android_collection_1795630354712.jpg',
  appDiscovery: '/src/assets/images/showcase_app_discovery_1795630355201.jpg',
  appManagement: '/src/assets/images/showcase_app_management_1795630356248.jpg',
} as const;

export const OFFICIAL_FOOTER_DESCRIPTION =
  'STORE PRO is your destination for discovering premium Android applications. Explore trending apps, discover new releases, and experience a smarter way to find your favorite apps. Browse with confidence, explore with ease, and enjoy the world of Android applications with STORE PRO.';

export const FIELD_LIMITS = {
  idMax: 128,
  nameMax: 120,
  slugMax: 140,
  iconUrlMax: 350000,
  screenshotsMaxCount: 8,
  versionMax: 40,
  sizeMax: 40,
  developerNameMax: 100,
  categoryMax: 60,
  shortDescriptionMax: 220,
  fullDescriptionMax: 6000,
  featuresMaxCount: 20,
  featureItemMax: 160,
  whatsNewMax: 2500,
  dateMax: 30,
  savedAppsMax: 100,
  searchHistoryMax: 30,
  browsingHistoryMax: 50,
} as const;

export const PATTERNS = {
  id: /^[a-zA-Z0-9_-]+$/,
  slug: /^[a-z0-9-]+$/,
  httpsUrl: /^https:\/\/.+/,
} as const;

export function toSlug(input: string): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (cleaned || 'app-item').slice(0, FIELD_LIMITS.slugMax);
}

export function sanitizeImageSrc(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/src/assets/') ||
    trimmed.startsWith('/icon') ||
    trimmed.startsWith('/pwa-') ||
    trimmed.startsWith('/9075') ||
    trimmed.startsWith('/9076') ||
    /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)
  ) {
    return trimmed;
  }
  return '';
}

export function sanitizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }
  return '';
}

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  storeProDownloadUrl: STORE_PRO_DOWNLOAD_URL,
  websiteName: 'STORE PRO',
  websiteLogoUrl: GENERATED_MEDIA.logo9075,
  websiteDescription: OFFICIAL_FOOTER_DESCRIPTION,
  themeAccent: 'rgb-gold',
  contactEmail: 'hasimsk12sk@gmail.com',
  supportUrl: 'https://github.com/hasim121/STORE-PRO-APK-NEW/releases',
  twitterUrl: '',
  telegramUrl: STORE_PRO_TELEGRAM_URL,
  githubUrl: 'https://github.com/hasim121/STORE-PRO-APK-NEW',
  seoTitle: 'STORE PRO — Independent Android Apps Marketplace',
  seoDescription:
    'Discover curated Android apps on STORE PRO, an independent premium apps marketplace with verified listings and official STORE PRO APK downloads.',
  seoKeywords:
    'STORE PRO, STORE PRO App Store, STORE PRO APK, Independent App Marketplace, Android Apps Marketplace, Premium Apps Marketplace',
  latestStoreProVersion: '3.4.0',
  latestStoreProVersionName: 'RGB Obsidian Gold Release',
  latestReleaseNotes:
    'Improved Android deep-link routing from web listings, refined RGB black-card interface performance on low-end devices, and verified direct GitHub release delivery.',
  latestReleaseDate: '2026-11-20',
  updateHistory: [
    'v3.4.0 | RGB Obsidian Gold Release | Enhanced deep-link home fallback & low-RAM animation budget | 2026-11-20',
    'v3.3.2 | Core Stability Patch | Faster APK download verification & improved download resume | 2026-10-14',
    'v3.2.0 | Independent Web Bridge | Introduced isolated STORE PRO website deep-link handshake | 2026-09-02',
  ],
};

export const DEFAULT_CATEGORY_SEEDS: Omit<WebsiteCategory, 'createdAt' | 'updatedAt'>[] = [
  { id: 'social-media', name: 'Social Media', slug: 'social-media', description: 'Community networks and publishing feeds', iconName: 'Users', displayOrder: 1, isActive: true },
  { id: 'communication', name: 'Communication', slug: 'communication', description: 'Messaging, voice, and encrypted calls', iconName: 'MessageSquare', displayOrder: 2, isActive: true },
  { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', description: 'Streaming, cinema, and live shows', iconName: 'Tv', displayOrder: 3, isActive: true },
  { id: 'video-editors', name: 'Video Editors', slug: 'video-editors', description: 'Timeline cutting, color grading, and reels', iconName: 'Film', displayOrder: 4, isActive: true },
  { id: 'photo-editors', name: 'Photo Editors', slug: 'photo-editors', description: 'RAW retouching, filters, and presets', iconName: 'Camera', displayOrder: 5, isActive: true },
  { id: 'music-audio', name: 'Music & Audio', slug: 'music-audio', description: 'Hi-res players, podcasts, and DAWs', iconName: 'Music', displayOrder: 6, isActive: true },
  { id: 'games', name: 'Games', slug: 'games', description: 'Action, strategy, and indie releases', iconName: 'Gamepad2', displayOrder: 7, isActive: true },
  { id: 'tools', name: 'Tools', slug: 'tools', description: 'System utilities, file managers, and benchmarks', iconName: 'Wrench', displayOrder: 8, isActive: true },
  { id: 'productivity', name: 'Productivity', slug: 'productivity', description: 'Notes, task workflows, and AI assistants', iconName: 'Briefcase', displayOrder: 9, isActive: true },
  { id: 'education', name: 'Education', slug: 'education', description: 'Courses, languages, and study companions', iconName: 'GraduationCap', displayOrder: 10, isActive: true },
  { id: 'security', name: 'Security', slug: 'security', description: 'Password vaults, VPNs, and privacy shields', iconName: 'Shield', displayOrder: 11, isActive: true },
  { id: 'personalization', name: 'Personalization', slug: 'personalization', description: 'Launchers, icon packs, and live themes', iconName: 'Palette', displayOrder: 12, isActive: true },
  { id: 'finance', name: 'Finance', slug: 'finance', description: 'Budgets, portfolios, and expense ledgers', iconName: 'Wallet', displayOrder: 13, isActive: true },
  { id: 'lifestyle', name: 'Lifestyle', slug: 'lifestyle', description: 'Fitness, wellness, and daily habits', iconName: 'Compass', displayOrder: 14, isActive: true },
  { id: 'other-apps', name: 'Other Apps', slug: 'other-apps', description: 'Specialized and experimental utilities', iconName: 'Grid', displayOrder: 15, isActive: true },
];

export const DEFAULT_BANNER_SEEDS: Omit<WebsiteBanner, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'banner-official-storepro',
    title: 'Discover Premium Android Apps with STORE PRO',
    subtitle:
      'Every curated web listing routes directly through the official STORE PRO Android installer—clean, fast, and verified.',
    imageUrl: GENERATED_MEDIA.banner9076,
    ctaLabel: 'Explore Catalog',
    targetAppId: '',
    targetRoute: 'apps',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'banner-creator-suite',
    title: 'Curated Mobile Collections & Instant Discovery',
    subtitle:
      'Explore trending utilities, editors, and mobile releases managed independently for the STORE PRO web marketplace.',
    imageUrl: GENERATED_MEDIA.androidCollection,
    ctaLabel: 'View Trending',
    targetAppId: '',
    targetRoute: 'trending',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'banner-security-vault',
    title: 'Official STORE PRO Release Channel',
    subtitle:
      'Stay up to date with the latest official STORE PRO Android build and release history.',
    imageUrl: GENERATED_MEDIA.appManagement,
    ctaLabel: 'Release Notes',
    targetAppId: '',
    targetRoute: 'updates',
    displayOrder: 3,
    isActive: true,
  },
];
