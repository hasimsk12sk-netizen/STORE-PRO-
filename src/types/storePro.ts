import type { Timestamp } from 'firebase/firestore';

export type AppStatus = 'published' | 'unpublished' | 'draft';

export type NavSection =
  | 'home'
  | 'apps'
  | 'categories'
  | 'trending'
  | 'top-downloads'
  | 'library'
  | 'updates'
  | 'about'
  | 'profile'
  | 'admin'
  | 'app-detail';

export type AdminTab =
  | 'overview'
  | 'apps'
  | 'upload'
  | 'categories'
  | 'banners'
  | 'settings'
  | 'users';

export interface WebsiteApp {
  id: string;
  name: string;
  slug: string;
  iconUrl: string;
  screenshots: string[];
  version: string;
  size: string;
  developerName: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  whatsNew: string;
  uploadDate: string;
  updatedDate: string;
  status: AppStatus;
  isFeatured: boolean;
  isTrending: boolean;
  isPopular: boolean;
  downloadCount: number;
  viewCount: number;
  createdBy: string;
  createdAt?: Timestamp | unknown;
  updatedAt?: Timestamp | unknown;
}

export interface WebsiteCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: Timestamp | unknown;
  updatedAt?: Timestamp | unknown;
}

export interface WebsiteBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  targetAppId: string;
  targetRoute: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: Timestamp | unknown;
  updatedAt?: Timestamp | unknown;
}

export interface WebsiteUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  savedAppIds: string[];
  favoriteAppIds: string[];
  browsingHistory: string[];
  searchHistory: string[];
  notificationsEnabled: boolean;
  compactMode: boolean;
  createdAt?: Timestamp | unknown;
  updatedAt?: Timestamp | unknown;
}

export interface WebsiteAdmin {
  uid: string;
  email: string;
  displayName: string;
  addedBy: string;
  createdAt?: Timestamp | unknown;
}

export interface WebsiteSettings {
  storeProDownloadUrl: string;
  websiteName: string;
  websiteLogoUrl: string;
  websiteDescription: string;
  themeAccent: string;
  contactEmail: string;
  supportUrl: string;
  twitterUrl: string;
  telegramUrl: string;
  githubUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  latestStoreProVersion: string;
  latestStoreProVersionName: string;
  latestReleaseNotes: string;
  latestReleaseDate: string;
  updateHistory: string[];
  updatedAt?: Timestamp | unknown;
}

export type AnalyticsEventType = 'app_view' | 'install_click' | 'storepro_redirect';

export interface WebsiteAnalyticsEvent {
  id?: string;
  eventType: AnalyticsEventType;
  appId: string;
  appName: string;
  category: string;
  userId: string;
  dateKey: string;
  createdAt?: Timestamp | unknown;
}
