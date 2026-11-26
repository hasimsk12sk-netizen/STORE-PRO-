import React, { useMemo, useRef, useState } from 'react';
import { Clock, Search, TrendingUp, X } from 'lucide-react';
import type { WebsiteApp, WebsiteCategory } from '../types/storePro';

interface SearchBarProps {
  query: string;
  onQueryChange: (val: string) => void;
  onSubmitSearch: (term: string) => void;
  apps: WebsiteApp[];
  categories: WebsiteCategory[];
  searchHistory: string[];
  onSelectApp: (app: WebsiteApp) => void;
  onSelectCategory: (categoryName: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  onSubmitSearch,
  apps,
  categories,
  searchHistory,
  onSelectApp,
  onSelectCategory,
  placeholder = 'Search Android apps, developers, or categories...',
}) => {
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const popularSearches = useMemo(() => {
    const appNames = apps.slice(0, 4).map((a) => a.name);
    const catNames = categories.slice(0, 4).map((c) => c.name);
    return Array.from(new Set([...appNames, ...catNames])).slice(0, 6);
  }, [apps, categories]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { matchedApps: [] as WebsiteApp[], matchedCategories: [] as WebsiteCategory[] };
    return {
      matchedApps: apps
        .filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.developerName.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q) ||
            a.shortDescription.toLowerCase().includes(q)
        )
        .slice(0, 5),
      matchedCategories: categories
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 3),
    };
  }, [query, apps, categories]);

  const showDropdown =
    focused &&
    (query.trim().length > 0
      ? suggestions.matchedApps.length > 0 || suggestions.matchedCategories.length > 0
      : searchHistory.length > 0 || popularSearches.length > 0);

  return (
    <div
      ref={containerRef}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setFocused(false);
        }
      }}
      className="relative w-full"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitSearch(query);
          setFocused(false);
        }}
        className={`sp-rgb-dock relative flex items-center transition-transform duration-150 ${
          focused ? 'scale-[1.005]' : ''
        }`}
      >
        <Search className="w-4 h-4 text-[#00E5FF] absolute left-4 pointer-events-none z-10" />
        <input
          type="search"
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search STORE PRO catalog"
          className="w-full h-13 rounded-2xl bg-transparent pl-11 pr-24 text-sm text-white placeholder:text-[#8A92A6] focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
            className="absolute right-16 min-h-[36px] min-w-[36px] flex items-center justify-center text-[#9BA3B4] hover:text-white cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="sp-rgb-btn absolute right-1.5 h-9 px-4 text-xs font-semibold cursor-pointer z-10"
        >
          Find
        </button>
      </form>

      {showDropdown && (
        <div className="sp-rgb-card absolute left-0 right-0 top-15 z-30 p-5">
          {query.trim().length > 0 ? (
            <div className="space-y-3">
              {suggestions.matchedApps.length > 0 && (
                <div>
                  <p className="px-2 pb-1.5 text-xs font-medium text-[#9BA3B4]">
                    Applications
                  </p>
                  <div className="space-y-1">
                    {suggestions.matchedApps.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                          setFocused(false);
                          onSelectApp(app);
                        }}
                        className="w-full flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-white/10 transition cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {app.name}
                          </p>
                          <p className="text-xs text-[#9BA3B4] truncate">
                            {app.category} · v{app.version}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#00E5FF] shrink-0">View</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.matchedCategories.length > 0 && (
                <div>
                  <p className="px-2 pb-1.5 text-xs font-medium text-[#9BA3B4]">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-2 px-2">
                    {suggestions.matchedCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setFocused(false);
                          onSelectCategory(cat.name);
                        }}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:border-[#00E5FF] cursor-pointer"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {searchHistory.length > 0 && (
                <div>
                  <p className="px-2 pb-1.5 text-xs font-medium text-[#9BA3B4] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span>Recent Searches</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {searchHistory.slice(0, 6).map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          onQueryChange(term);
                          onSubmitSearch(term);
                          setFocused(false);
                        }}
                        className="rounded-lg border border-white/15 bg-[#171A24] px-3 py-1.5 text-xs text-white hover:border-[#00E5FF] cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {popularSearches.length > 0 && (
                <div>
                  <p className="px-2 pb-1.5 text-xs font-medium text-[#9BA3B4] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00FF66]" />
                    <span>Popular Searches</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          onQueryChange(term);
                          onSubmitSearch(term);
                          setFocused(false);
                        }}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-[#FFD700] hover:border-[#FFD700] cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
