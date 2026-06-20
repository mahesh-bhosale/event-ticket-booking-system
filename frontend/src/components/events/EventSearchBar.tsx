import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────
const RECENT_SEARCHES_KEY = 'sortmyscene_recent_searches';
const MAX_RECENT_SEARCHES = 5;

// ─────────────────────────────────────────────────────────────
//  Recent Searches Helpers
// ─────────────────────────────────────────────────────────────
function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string): void {
  const trimmed = term.trim();
  if (!trimmed) return;
  const existing = getRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────
interface EventSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Called when a search is "committed" (e.g. on Enter or suggestion click) */
  onCommit?: (value: string) => void;
}

export function EventSearchBar({ value, onChange, onCommit }: EventSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches when dropdown opens
  useEffect(() => {
    if (isFocused) {
      setRecentSearches(getRecentSearches());
      setHighlightedIndex(-1);
    }
  }, [isFocused]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const commitSearch = useCallback(
    (term: string) => {
      saveRecentSearch(term);
      onChange(term);
      onCommit?.(term);
      setIsFocused(false);
      inputRef.current?.blur();
    },
    [onChange, onCommit],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const showDropdown = isFocused && recentSearches.length > 0 && !value;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && highlightedIndex >= 0) {
        commitSearch(recentSearches[highlightedIndex]!);
      } else if (value.trim()) {
        commitSearch(value);
      }
      return;
    }

    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < recentSearches.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : recentSearches.length - 1));
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    onChange('');
    onCommit?.('');
    inputRef.current?.focus();
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  const showDropdown = isFocused && recentSearches.length > 0 && !value;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          aria-label="Search events"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? 'recent-searches-list' : undefined}
          aria-activedescendant={
            showDropdown && highlightedIndex >= 0
              ? `recent-search-${highlightedIndex}`
              : undefined
          }
          placeholder="Search events..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="flex h-10 w-full rounded-xl border border-border/40 bg-secondary/30 pl-10 pr-10 py-1.5 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/80 focus:border-primary/80 transition-all duration-200"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-0.5 rounded-md text-muted-foreground hover:text-white hover:bg-secondary/60 transition-colors duration-150"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Recent Searches Dropdown */}
      {showDropdown && (
        <div
          id="recent-searches-list"
          role="listbox"
          aria-label="Recent searches"
          className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/20">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Recent Searches
            </span>
            <button
              type="button"
              onClick={handleClearRecent}
              className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary tracking-wider transition-colors duration-150"
            >
              Clear
            </button>
          </div>
          <ul className="py-1">
            {recentSearches.map((term, index) => (
              <li
                key={term}
                id={`recent-search-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitSearch(term);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex items-center gap-2.5 px-3.5 py-2 text-sm cursor-pointer transition-colors duration-100 ${
                  highlightedIndex === index
                    ? 'bg-primary/10 text-white'
                    : 'text-muted-foreground hover:bg-secondary/40 hover:text-white'
                }`}
              >
                <Clock className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                <span className="truncate">{term}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default EventSearchBar;
