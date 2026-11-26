import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  Edit3,
  Eye,
  EyeOff,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  Link2,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  DEFAULT_CATEGORY_SEEDS,
  FIELD_LIMITS,
  sanitizeImageSrc,
  STORE_PRO_DOWNLOAD_URL,
  toSlug,
} from '../config/storeProConfig';
import {
  addWebsiteAdmin,
  createWebsiteApp,
  deleteWebsiteApp,
  deleteWebsiteBanner,
  deleteWebsiteCategory,
  removeWebsiteAdmin,
  saveWebsiteBanner,
  saveWebsiteCategory,
  saveWebsiteSettings,
  seedDefaultWebsiteBanners,
  seedDefaultWebsiteCategories,
  updateWebsiteApp,
} from '../services/firestoreService';
import { uploadWebsiteImage } from '../services/imageUploadService';
import type {
  AdminTab,
  AppStatus,
  WebsiteAdmin,
  WebsiteAnalyticsEvent,
  WebsiteApp,
  WebsiteBanner,
  WebsiteCategory,
  WebsiteSettings,
  WebsiteUser,
} from '../types/storePro';

interface AdminDashboardProps {
  user: FirebaseUser;
  apps: WebsiteApp[];
  categories: WebsiteCategory[];
  banners: WebsiteBanner[];
  settings: WebsiteSettings;
  analytics: WebsiteAnalyticsEvent[];
  users: WebsiteUser[];
  admins: WebsiteAdmin[];
  onBackToStore: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  apps,
  categories,
  banners,
  settings,
  analytics,
  users,
  admins,
  onBackToStore,
}) => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // App Form State
  const [editingApp, setEditingApp] = useState<WebsiteApp | null>(null);
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [screenshotInput, setScreenshotInput] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [size, setSize] = useState('24 MB');
  const [developerName, setDeveloperName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || DEFAULT_CATEGORY_SEEDS[0].name);
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [whatsNew, setWhatsNew] = useState('');
  const [uploadDate, setUploadDate] = useState(todayStr());
  const [updatedDate, setUpdatedDate] = useState(todayStr());
  const [status, setStatus] = useState<AppStatus>('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [savingApp, setSavingApp] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catOrder, setCatOrder] = useState(categories.length + 1);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Banner Form State
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerCta, setBannerCta] = useState('Explore Catalog');
  const [bannerTargetAppId, setBannerTargetAppId] = useState('');
  const [bannerTargetRoute, setBannerTargetRoute] = useState('apps');
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Settings State
  const [settingsDraft, setSettingsDraft] = useState<WebsiteSettings>(settings);
  const [historyDraft, setHistoryDraft] = useState(settings.updateHistory.join('\n'));
  const [savingSettings, setSavingSettings] = useState(false);

  React.useEffect(() => {
    setSettingsDraft(settings);
    setHistoryDraft(settings.updateHistory.join('\n'));
  }, [settings]);

  // Admin Management State
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  const flashTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const flash = (msg: string) => {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
    setStatusMessage(msg);
    flashTimerRef.current = window.setTimeout(() => {
      flashTimerRef.current = null;
      setStatusMessage(null);
    }, 4000);
  };

  const metrics = useMemo(() => {
    const todayKey = todayStr();
    const installClicks = analytics.filter((e) => e.eventType === 'install_click').length;
    const storeProRedirects = analytics.filter((e) => e.eventType === 'storepro_redirect').length;
    const todayRequests = analytics.filter(
      (e) => e.eventType === 'install_click' && e.dateKey === todayKey
    ).length;

    const mostViewed = [...apps].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
    const popular = [...apps].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 5);
    const recent = [...apps].sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || '')).slice(0, 5);

    return {
      totalApps: apps.length,
      publishedApps: apps.filter((a) => a.status === 'published').length,
      installClicks,
      storeProRedirects,
      todayRequests,
      mostViewed,
      popular,
      recent,
    };
  }, [apps, analytics]);

  const resetAppForm = () => {
    setEditingApp(null);
    setName('');
    setIconUrl('');
    setScreenshots([]);
    setScreenshotInput('');
    setVersion('1.0.0');
    setSize('24 MB');
    setDeveloperName('');
    setCategory(categories[0]?.name || DEFAULT_CATEGORY_SEEDS[0].name);
    setShortDescription('');
    setFullDescription('');
    setFeaturesText('');
    setWhatsNew('');
    setUploadDate(todayStr());
    setUpdatedDate(todayStr());
    setStatus('published');
    setIsFeatured(false);
    setIsTrending(false);
    setIsPopular(false);
  };

  const startEditApp = (app: WebsiteApp) => {
    setEditingApp(app);
    setName(app.name);
    setIconUrl(app.iconUrl);
    setScreenshots(app.screenshots || []);
    setVersion(app.version);
    setSize(app.size);
    setDeveloperName(app.developerName);
    setCategory(app.category);
    setShortDescription(app.shortDescription);
    setFullDescription(app.fullDescription);
    setFeaturesText((app.features || []).join('\n'));
    setWhatsNew(app.whatsNew || '');
    setUploadDate(app.uploadDate || todayStr());
    setUpdatedDate(todayStr());
    setStatus(app.status);
    setIsFeatured(app.isFeatured);
    setIsTrending(app.isTrending);
    setIsPopular(app.isPopular);
    setTab('upload');
  };

  const handleIconFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const res = await uploadWebsiteImage(file, 'app_icons');
      setIconUrl(res.url);
      flash('Application icon uploaded.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Icon upload failed.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleScreenshotsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingMedia(true);
    try {
      const remaining = FIELD_LIMITS.screenshotsMaxCount - screenshots.length;
      const toUpload = files.slice(0, Math.max(0, remaining));
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        const res = await uploadWebsiteImage(file, 'app_screenshots');
        uploadedUrls.push(res.url);
      }
      setScreenshots((prev) => [...prev, ...uploadedUrls].slice(0, FIELD_LIMITS.screenshotsMaxCount));
      flash(`Uploaded ${uploadedUrls.length} screenshot(s).`);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Screenshot upload failed.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !iconUrl.trim() || !shortDescription.trim() || !fullDescription.trim()) {
      flash('Please fill in Application Name, Icon, Short Description, and Full Description.');
      return;
    }

    setSavingApp(true);
    try {
      const parsedFeatures = featuresText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (editingApp) {
        await updateWebsiteApp(editingApp, {
          name,
          slug: toSlug(name),
          iconUrl,
          screenshots,
          version,
          size,
          developerName: developerName || 'Independent Developer',
          category,
          shortDescription,
          fullDescription,
          features: parsedFeatures,
          whatsNew,
          uploadDate,
          updatedDate: updatedDate || todayStr(),
          status,
          isFeatured,
          isTrending,
          isPopular,
        });
        flash(`Updated "${name}" successfully.`);
      } else {
        await createWebsiteApp({
          name,
          slug: toSlug(name),
          iconUrl,
          screenshots,
          version,
          size,
          developerName: developerName || 'Independent Developer',
          category,
          shortDescription,
          fullDescription,
          features: parsedFeatures,
          whatsNew,
          uploadDate: uploadDate || todayStr(),
          updatedDate: updatedDate || todayStr(),
          status,
          isFeatured,
          isTrending,
          isPopular,
        });
        flash(`Published "${name}" to STORE PRO Website.`);
      }
      resetAppForm();
      setTab('apps');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to save application.');
    } finally {
      setSavingApp(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    const id = editingCatId || toSlug(catName);
    await saveWebsiteCategory(
      {
        id,
        name: catName.trim(),
        slug: toSlug(catName),
        description: catDesc.trim() || `${catName.trim()} applications`,
        iconName: 'Grid',
        displayOrder: Number(catOrder) || 1,
        isActive: true,
      },
      !editingCatId
    );
    setCatName('');
    setCatDesc('');
    setEditingCatId(null);
    flash('Category saved.');
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerImage.trim()) return;
    const id = editingBannerId || `banner-${Date.now().toString(36)}`;
    await saveWebsiteBanner(
      {
        id,
        title: bannerTitle.trim(),
        subtitle: bannerSubtitle.trim(),
        imageUrl: bannerImage.trim(),
        ctaLabel: bannerCta.trim() || 'Explore',
        targetAppId: bannerTargetAppId,
        targetRoute: bannerTargetRoute,
        displayOrder: banners.length + 1,
        isActive: true,
      },
      !editingBannerId
    );
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerImage('');
    setBannerCta('Explore Catalog');
    setBannerTargetAppId('');
    setEditingBannerId(null);
    flash('Banner saved.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveWebsiteSettings({
        ...settingsDraft,
        updateHistory: historyDraft
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
      });
      flash('Website settings & centralized STORE PRO APK URL updated.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const adminTabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Analytics', icon: BarChart3 },
    { id: 'apps', label: 'Manage Apps', icon: Layers },
    { id: 'upload', label: editingApp ? 'Edit App' : 'Upload App', icon: Upload },
    { id: 'categories', label: 'Categories', icon: FolderPlus },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'settings', label: 'Settings & APK URL', icon: Settings },
    { id: 'users', label: 'Users & Admins', icon: Users },
  ];

  return (
    <div className="space-y-8 pb-28 md:pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <p className="text-xs font-semibold text-[#287BFF]">
            Independent Website Admin Console · {user.email}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0D12] mt-1">
            STORE PRO Website Dashboard
          </h1>
        </div>
        <button
          type="button"
          onClick={onBackToStore}
          className="sp-rgb-btn min-h-[42px] px-4 py-2 text-xs font-semibold cursor-pointer self-start sm:self-auto"
        >
          View Live Website
        </button>
      </div>

      {statusMessage && (
        <div className="sp-rgb-dock px-4 py-3 text-sm text-[#00FF66] flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
        {adminTabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'upload' && !editingApp) {
                  resetAppForm();
                }
                setTab(item.id);
              }}
              className={`min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                tab === item.id
                  ? 'sp-install-btn'
                  : 'sp-rgb-btn opacity-80 hover:opacity-100'
              }`}
            >
              <Icon className="w-4 h-4 text-[#00E5FF]" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard label="Total Website Apps" value={metrics.totalApps} sub={`${metrics.publishedApps} published`} />
            <MetricCard label="INSTALL Button Clicks" value={metrics.installClicks} sub="User install intent" />
            <MetricCard label="STORE PRO Redirects" value={metrics.storeProRedirects} sub="Official APK redirects" />
            <MetricCard label="Today's Requests" value={metrics.todayRequests} sub={todayStr()} />
          </div>

          <div className="sp-rgb-card p-4 text-xs text-[#B8BFCE]">
            Analytics distinction: INSTALL button clicks and STORE PRO APK redirects measure intent and handoffs—they are tracked separately and do not claim completed third-party APK installations.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AnalyticsList title="Most Viewed Apps" apps={metrics.mostViewed} metricKey="viewCount" suffix="views" />
            <AnalyticsList title="Popular Applications" apps={metrics.popular} metricKey="downloadCount" suffix="clicks" />
            <div className="sp-rgb-card p-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-white">
                Recent Uploads
              </h3>
              {metrics.recent.length === 0 ? (
                <p className="text-xs text-[#9BA3B4]">No apps uploaded yet.</p>
              ) : (
                <ul className="divide-y divide-white/10 text-sm">
                  {metrics.recent.map((app) => (
                    <li key={app.id} className="py-2.5 flex items-center justify-between gap-2">
                      <span className="truncate text-white">{app.name}</span>
                      <span className="font-mono text-xs text-[#9BA3B4] shrink-0">{app.uploadDate}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE APPS */}
      {tab === 'apps' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-bold text-[#0B0D12]">
              Website Applications ({apps.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                resetAppForm();
                setTab('upload');
              }}
              className="sp-install-btn min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#00FF66]" />
              <span>Upload New App</span>
            </button>
          </div>

          {apps.length === 0 ? (
            <div className="sp-rgb-card p-10 text-center space-y-3">
              <p className="text-sm text-[#9BA3B4]">
                No applications uploaded to the website database yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="sp-rgb-card sp-rgb-card-hover p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={sanitizeImageSrc(app.iconUrl)}
                      alt={app.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-white/15 bg-[#161924] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">
                        {app.name}
                      </p>
                      <p className="text-xs text-[#9BA3B4] truncate">
                        {app.category} · v{app.version} · {app.status.toUpperCase()} · {app.downloadCount} clicks
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        void updateWebsiteApp(app, {
                          status: app.status === 'published' ? 'unpublished' : 'published',
                        })
                      }
                      className="sp-rgb-btn min-h-[38px] inline-flex items-center gap-1.5 px-3 text-xs font-semibold cursor-pointer"
                    >
                      {app.status === 'published' ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-[#9BA3B4]" />
                          <span>Unpublish</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-[#00FF66]" />
                          <span>Publish</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEditApp(app)}
                      className="sp-rgb-btn min-h-[38px] inline-flex items-center gap-1.5 px-3 text-xs font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#00E5FF]" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void deleteWebsiteApp(app.id);
                        flash(`Deleted "${app.name}".`);
                      }}
                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-3 text-xs font-semibold text-red-300 hover:bg-red-500/25 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: UPLOAD / EDIT APPLICATION FORM */}
      {tab === 'upload' && (
        <form
          onSubmit={(e) => void handleSaveApp(e)}
          className="sp-rgb-card p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">
                {editingApp ? `Edit "${editingApp.name}"` : 'Upload Website Application'}
              </h2>
              <p className="text-xs text-[#9BA3B4] mt-0.5">
                Uploads here affect only the independent STORE PRO Website catalog.
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-[#151823] px-3 py-2 text-xs text-[#00E5FF] flex items-center gap-2">
              <Link2 className="w-4 h-4 shrink-0 text-[#00FF66]" />
              <span>INSTALL button auto-linked to centralized STORE_PRO_DOWNLOAD_URL</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="1. Application Name *">
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.nameMax}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ChatGPT"
                className={inputClass}
              />
            </Field>

            <Field label="6. Developer Name *">
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.developerNameMax}
                value={developerName}
                onChange={(e) => setDeveloperName(e.target.value)}
                placeholder="e.g. OpenAI"
                className={inputClass}
              />
            </Field>

            <Field label="4. Application Version *">
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.versionMax}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className={inputClass}
              />
            </Field>

            <Field label="5. Application Size *">
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.sizeMax}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="24 MB"
                className={inputClass}
              />
            </Field>

            <Field label="7. Application Category *">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {(categories.length > 0 ? categories : DEFAULT_CATEGORY_SEEDS).map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="14. Application Status *">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppStatus)}
                className={inputClass}
              >
                <option value="published">Published (Live on Website)</option>
                <option value="unpublished">Unpublished (Hidden)</option>
                <option value="draft">Draft</option>
              </select>
            </Field>

            <Field label="12. Upload Date">
              <input
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="13. Updated Date">
              <input
                type="date"
                value={updatedDate}
                onChange={(e) => setUpdatedDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {/* 2. Application Icon Upload */}
          <div className="space-y-3 rounded-2xl border border-white/15 bg-[#07080C] p-4">
            <label className="text-xs font-semibold text-white block">
              2. Application Icon / Image * (Upload from mobile phone / file manager or paste URL)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {iconUrl && (
                <img
                  src={sanitizeImageSrc(iconUrl)}
                  alt="Icon preview"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border border-white/20 shrink-0"
                />
              )}
              <div className="flex-1 w-full space-y-2">
                <label className="sp-rgb-btn min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold cursor-pointer">
                  <Upload className="w-4 h-4 text-[#00E5FF]" />
                  <span>{uploadingMedia ? 'Uploading...' : 'Select Icon from Device'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleIconFileUpload(e)}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="Or paste HTTPS icon URL..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 3. Multiple Application Screenshots */}
          <div className="space-y-3 rounded-2xl border border-white/15 bg-[#07080C] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-white">
                3. Application Screenshots ({screenshots.length}/{FIELD_LIMITS.screenshotsMaxCount})
              </label>
              <label className="sp-rgb-btn min-h-[38px] inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#00FF66]" />
                <span>Add Screenshots from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => void handleScreenshotsUpload(e)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={screenshotInput}
                onChange={(e) => setScreenshotInput(e.target.value)}
                placeholder="Or paste screenshot HTTPS URL and click Add"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  if (!screenshotInput.trim()) return;
                  setScreenshots((prev) =>
                    [...prev, screenshotInput.trim()].slice(0, FIELD_LIMITS.screenshotsMaxCount)
                  );
                  setScreenshotInput('');
                }}
                className="sp-rgb-btn px-4 text-xs font-semibold shrink-0 cursor-pointer"
              >
                Add
              </button>
            </div>

            {screenshots.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {screenshots.map((src, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/15 aspect-video bg-[#13151E]">
                    <img
                      src={sanitizeImageSrc(src)}
                      alt={`Screenshot ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setScreenshots((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove screenshot"
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/80 text-red-300 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Field label="8. Short Description *">
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.shortDescriptionMax}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One-line summary displayed on marketplace cards"
              className={inputClass}
            />
          </Field>

          <Field label="9. Full Description *">
            <textarea
              required
              rows={5}
              maxLength={FIELD_LIMITS.fullDescriptionMax}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed overview of application capabilities and usage..."
              className={`${inputClass} py-3 h-auto`}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="10. Application Features (one per line)">
              <textarea
                rows={4}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder={'Fast offline sync\nDark AMOLED theme\nEnd-to-end encryption'}
                className={`${inputClass} py-3 h-auto`}
              />
            </Field>

            <Field label="11. What's New">
              <textarea
                rows={4}
                maxLength={FIELD_LIMITS.whatsNewMax}
                value={whatsNew}
                onChange={(e) => setWhatsNew(e.target.value)}
                placeholder="Release highlights and improvements in this version..."
                className={`${inputClass} py-3 h-auto`}
              />
            </Field>
          </div>

          {/* 15. Featured / Trending / Popular */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#FFD700]"
              />
              <span>15a. Featured App</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                className="w-4 h-4 accent-[#00E5FF]"
              />
              <span>15b. Trending App</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="w-4 h-4 accent-[#00FF66]"
              />
              <span>15c. Popular App</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={savingApp || uploadingMedia}
              className="sp-install-btn min-h-[46px] inline-flex items-center gap-2 px-6 py-3 text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#00FF66]" />
              <span>{savingApp ? 'Saving...' : editingApp ? 'Save Changes' : 'Publish to Website'}</span>
            </button>

            {editingApp && (
              <button
                type="button"
                onClick={resetAppForm}
                className="sp-rgb-btn min-h-[46px] px-5 py-3 text-sm font-semibold cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {/* TAB 4: MANAGE CATEGORIES */}
      {tab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={(e) => void handleSaveCategory(e)}
            className="lg:col-span-5 sp-rgb-card p-6 space-y-4 h-fit"
          >
            <h2 className="font-display text-lg font-semibold text-white">
              {editingCatId ? 'Edit Category' : 'Add Website Category'}
            </h2>
            <Field label="Category Name">
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. AI Assistants"
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Short category summary"
                className={inputClass}
              />
            </Field>
            <Field label="Display Order">
              <input
                type="number"
                min={0}
                value={catOrder}
                onChange={(e) => setCatOrder(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="sp-install-btn min-h-[42px] px-5 text-xs font-bold cursor-pointer"
              >
                {editingCatId ? 'Update' : 'Add Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void seedDefaultWebsiteCategories();
                  flash('Seeded default 15 STORE PRO website categories.');
                }}
                className="sp-rgb-btn min-h-[42px] px-4 text-xs font-semibold cursor-pointer"
              >
                Seed 15 Default Categories
              </button>
            </div>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="sp-rgb-card p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {cat.name} <span className="font-mono text-xs text-[#00E5FF]">#{cat.displayOrder}</span>
                  </p>
                  <p className="text-xs text-[#9BA3B4]">{cat.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(cat.id);
                      setCatName(cat.name);
                      setCatDesc(cat.description);
                      setCatOrder(cat.displayOrder);
                    }}
                    className="sp-rgb-btn px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteWebsiteCategory(cat.id)}
                    className="px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-500/15 text-xs font-semibold text-red-300 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MANAGE BANNERS */}
      {tab === 'banners' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={(e) => void handleSaveBanner(e)}
            className="lg:col-span-5 sp-rgb-card p-6 space-y-4 h-fit"
          >
            <h2 className="font-display text-lg font-semibold text-white">
              {editingBannerId ? 'Edit Banner' : 'Add Website Banner'}
            </h2>
            <Field label="Banner Title *">
              <input
                type="text"
                required
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Subtitle">
              <input
                type="text"
                value={bannerSubtitle}
                onChange={(e) => setBannerSubtitle(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Banner Image *">
              <div className="space-y-2">
                <label className="sp-rgb-btn inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Upload Banner Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void uploadWebsiteImage(file, 'banners').then((res) => setBannerImage(res.url));
                    }}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  required
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="Or paste HTTPS image URL"
                  className={inputClass}
                />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Button Label">
                <input
                  type="text"
                  value={bannerCta}
                  onChange={(e) => setBannerCta(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Target Route">
                <select
                  value={bannerTargetRoute}
                  onChange={(e) => setBannerTargetRoute(e.target.value)}
                  className={inputClass}
                >
                  <option value="apps">All Apps</option>
                  <option value="trending">Trending</option>
                  <option value="top-downloads">Top Downloads</option>
                  <option value="updates">Updates</option>
                </select>
              </Field>
            </div>
            <Field label="Or Target Specific App (Optional)">
              <select
                value={bannerTargetAppId}
                onChange={(e) => setBannerTargetAppId(e.target.value)}
                className={inputClass}
              >
                <option value="">None (use target route)</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="sp-install-btn min-h-[42px] px-5 text-xs font-bold cursor-pointer"
              >
                {editingBannerId ? 'Update Banner' : 'Publish Banner'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void seedDefaultWebsiteBanners();
                  flash('Seeded default STORE PRO hero banners.');
                }}
                className="sp-rgb-btn min-h-[42px] px-4 text-xs font-semibold cursor-pointer"
              >
                Seed Default Banners
              </button>
            </div>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {banners.map((b) => (
              <div
                key={b.id}
                className="sp-rgb-card p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={sanitizeImageSrc(b.imageUrl)}
                    alt={b.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-12 rounded-lg object-cover border border-white/15 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                    <p className="text-xs text-[#9BA3B4] truncate">{b.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBannerId(b.id);
                      setBannerTitle(b.title);
                      setBannerSubtitle(b.subtitle);
                      setBannerImage(b.imageUrl);
                      setBannerCta(b.ctaLabel);
                      setBannerTargetAppId(b.targetAppId);
                      setBannerTargetRoute(b.targetRoute);
                    }}
                    className="sp-rgb-btn px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteWebsiteBanner(b.id)}
                    className="px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-500/15 text-xs font-semibold text-red-300 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CENTRALIZED WEBSITE SETTINGS & STORE_PRO_DOWNLOAD_URL */}
      {tab === 'settings' && (
        <form
          onSubmit={(e) => void handleSaveSettings(e)}
          className="sp-rgb-card p-6 sm:p-8 space-y-6"
        >
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              Centralized Website Settings
            </h2>
            <p className="text-xs text-[#9BA3B4] mt-0.5">
              Changing STORE_PRO_DOWNLOAD_URL here automatically updates every application's INSTALL button across the entire website.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-[#07080C] p-5 space-y-2">
            <label className="text-xs font-semibold text-[#FFD700] block">
              STORE_PRO_DOWNLOAD_URL (Official STORE PRO APK URL) *
            </label>
            <input
              type="url"
              required
              value={settingsDraft.storeProDownloadUrl}
              onChange={(e) =>
                setSettingsDraft({ ...settingsDraft, storeProDownloadUrl: e.target.value })
              }
              className={inputClass}
            />
            <button
              type="button"
              onClick={() =>
                setSettingsDraft({
                  ...settingsDraft,
                  storeProDownloadUrl: STORE_PRO_DOWNLOAD_URL,
                })
              }
              className="text-xs text-[#00E5FF] underline cursor-pointer"
            >
              Reset to Official GitHub Release URL
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Website Name">
              <input
                type="text"
                value={settingsDraft.websiteName}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, websiteName: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Contact Email">
              <input
                type="email"
                value={settingsDraft.contactEmail}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, contactEmail: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Website Logo URL (or Upload)">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settingsDraft.websiteLogoUrl}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, websiteLogoUrl: e.target.value })
                  }
                  className={inputClass}
                />
                <label className="sp-rgb-btn px-3 flex items-center text-xs font-semibold shrink-0 cursor-pointer">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void uploadWebsiteImage(file, 'app_icons').then((res) =>
                        setSettingsDraft({ ...settingsDraft, websiteLogoUrl: res.url })
                      );
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </Field>
            <Field label="GitHub Repository URL">
              <input
                type="url"
                value={settingsDraft.githubUrl}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, githubUrl: e.target.value })
                }
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Website Description">
            <textarea
              rows={2}
              value={settingsDraft.websiteDescription}
              onChange={(e) =>
                setSettingsDraft({ ...settingsDraft, websiteDescription: e.target.value })
              }
              className={`${inputClass} py-2.5 h-auto`}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-white/10">
            <Field label="SEO Title">
              <input
                type="text"
                value={settingsDraft.seoTitle}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, seoTitle: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="SEO Keywords">
              <input
                type="text"
                value={settingsDraft.seoKeywords}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, seoKeywords: e.target.value })
                }
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="SEO Meta Description">
            <textarea
              rows={2}
              value={settingsDraft.seoDescription}
              onChange={(e) =>
                setSettingsDraft({ ...settingsDraft, seoDescription: e.target.value })
              }
              className={`${inputClass} py-2.5 h-auto`}
            />
          </Field>

          <div className="pt-4 border-t border-white/10 space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">
              Live STORE PRO Release Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Latest Version">
                <input
                  type="text"
                  value={settingsDraft.latestStoreProVersion}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      latestStoreProVersion: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Version Name">
                <input
                  type="text"
                  value={settingsDraft.latestStoreProVersionName}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      latestStoreProVersionName: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Release Date">
                <input
                  type="date"
                  value={settingsDraft.latestReleaseDate}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      latestReleaseDate: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Release Notes">
              <textarea
                rows={3}
                value={settingsDraft.latestReleaseNotes}
                onChange={(e) =>
                  setSettingsDraft({
                    ...settingsDraft,
                    latestReleaseNotes: e.target.value,
                  })
                }
                className={`${inputClass} py-2.5 h-auto`}
              />
            </Field>
            <Field label="Update History (one per line: Version | Codename | Notes | YYYY-MM-DD)">
              <textarea
                rows={4}
                value={historyDraft}
                onChange={(e) => setHistoryDraft(e.target.value)}
                className={`${inputClass} py-2.5 h-auto font-mono text-xs`}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="sp-install-btn min-h-[46px] px-6 py-3 text-sm font-bold cursor-pointer"
          >
            {savingSettings ? 'Saving Settings...' : 'Save Website Settings'}
          </button>
        </form>
      )}

      {/* TAB 7: MANAGE USERS & ADMINS */}
      {tab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 sp-rgb-card p-6 space-y-4 h-fit">
            <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00E5FF]" />
              <span>Authorize Website Admin</span>
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newAdminUid.trim() || !newAdminEmail.trim()) return;
                void addWebsiteAdmin(newAdminUid, newAdminEmail, newAdminName || 'Admin');
                setNewAdminUid('');
                setNewAdminEmail('');
                setNewAdminName('');
                flash('Added website administrator.');
              }}
              className="space-y-3"
            >
              <Field label="User UID *">
                <input
                  type="text"
                  required
                  value={newAdminUid}
                  onChange={(e) => setNewAdminUid(e.target.value)}
                  placeholder="Firebase Auth UID"
                  className={inputClass}
                />
              </Field>
              <Field label="Email *">
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className={inputClass}
                />
              </Field>
              <Field label="Display Name">
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <button
                type="submit"
                className="sp-install-btn min-h-[42px] px-5 text-xs font-bold cursor-pointer"
              >
                Grant Admin Access
              </button>
            </form>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-xs font-medium text-[#9BA3B4]">
                Additional Authorized Admins ({admins.length})
              </p>
              {admins.map((a) => (
                <div key={a.uid} className="flex items-center justify-between text-xs py-1.5">
                  <span className="truncate text-white">
                    {a.displayName} ({a.email})
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeWebsiteAdmin(a.uid)}
                    className="text-red-300 hover:underline cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 sp-rgb-card p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">
              Registered Website Users ({users.length})
            </h2>
            {users.length === 0 ? (
              <p className="text-sm text-[#9BA3B4]">No signed-in website users recorded yet.</p>
            ) : (
              <div className="divide-y divide-white/10">
                {users.map((u) => (
                  <div key={u.uid} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {u.displayName} ({u.email})
                      </p>
                      <p className="font-mono text-[11px] text-[#9BA3B4] truncate">
                        UID: {u.uid} · Saved: {u.savedAppIds?.length || 0} · Favorites: {u.favoriteAppIds?.length || 0}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewAdminUid(u.uid);
                        setNewAdminEmail(u.email);
                        setNewAdminName(u.displayName);
                      }}
                      className="text-xs font-semibold text-[#00E5FF] hover:underline shrink-0 cursor-pointer"
                    >
                      Select as Admin
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const inputClass =
  'w-full h-11 rounded-xl sp-dark-input px-3.5 text-sm transition';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-[#B8BFCE] block">{label}</label>
    {children}
  </div>
);

const MetricCard: React.FC<{ label: string; value: number; sub: string }> = ({
  label,
  value,
  sub,
}) => (
  <div className="sp-rgb-card sp-rgb-card-hover p-5 space-y-1">
    <p className="text-xs text-[#9BA3B4]">{label}</p>
    <p className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
      {value.toLocaleString()}
    </p>
    <p className="text-xs font-semibold text-[#00E5FF]">{sub}</p>
  </div>
);

const AnalyticsList: React.FC<{
  title: string;
  apps: WebsiteApp[];
  metricKey: 'viewCount' | 'downloadCount';
  suffix: string;
}> = ({ title, apps, metricKey, suffix }) => (
  <div className="sp-rgb-card p-5 space-y-3">
    <h3 className="font-display text-base font-semibold text-white">{title}</h3>
    {apps.length === 0 ? (
      <p className="text-xs text-[#9BA3B4]">No activity recorded yet.</p>
    ) : (
      <ul className="divide-y divide-white/10 text-sm">
        {apps.map((app) => (
          <li key={app.id} className="py-2.5 flex items-center justify-between gap-2">
            <span className="truncate text-white">{app.name}</span>
            <span className="font-mono text-xs text-[#FFD700] tabular-nums shrink-0">
              {app[metricKey]} {suffix}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);
