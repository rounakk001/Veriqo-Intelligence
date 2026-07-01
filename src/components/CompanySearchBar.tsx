"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SearchSuggestion } from "@/app/api/search/route";

// ── Types ──────────────────────────────────────────────────────────────────
interface CompanySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: (value?: string) => void;
  isLoading: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;
const CACHE_MAX_SIZE = 30;
const MAX_VISIBLE_RESULTS = 8;

// ── In-memory cache (survives re-renders, cleared on page reload) ──────────
const queryCache = new Map<string, SearchSuggestion[]>();

// ── Component ──────────────────────────────────────────────────────────────
export function CompanySearchBar({
  value,
  onChange,
  onAnalyze,
  isLoading,
}: CompanySearchBarProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Store the full selected suggestion object instead of just a string label
  const [selectedSuggestion, setSelectedSuggestion] = useState<SearchSuggestion | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ── Scroll active item into view ──────────────────────────────────────────
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ── Fetch suggestions with debounce ──────────────────────────────────────
  const fetchSuggestions = useCallback((query: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const cacheKey = query.trim().toLowerCase();

    // Serve from cache if available
    if (queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey)!;
      setSuggestions(cached);
      setIsOpen(cached.length > 0);
      setActiveIndex(-1);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsFetching(true);
      setIsOpen(true);

      // Abort any previous pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: abortController.signal }
        );

        if (!res.ok) {
          setSuggestions([]);
          return;
        }

        const data: SearchSuggestion[] | { error: string } = await res.json();

        if (Array.isArray(data)) {
          const limited = data.slice(0, MAX_VISIBLE_RESULTS);

          // Store in cache (bounded size)
          if (queryCache.size >= CACHE_MAX_SIZE) {
            const firstKey = queryCache.keys().next().value;
            if (firstKey !== undefined) queryCache.delete(firstKey);
          }
          queryCache.set(cacheKey, limited);

          setSuggestions(limited);
          setActiveIndex(-1);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Ignore aborted requests
          return;
        }
        setSuggestions([]);
      } finally {
        if (abortControllerRef.current === abortController) {
          setIsFetching(false);
        }
      }
    }, DEBOUNCE_MS);
  }, []);

  // ── Handle input change ────────────────────────────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // User started typing again — clear the stored suggestion so raw text shows
    setSelectedSuggestion(null);
    onChange(raw);
    fetchSuggestions(raw);
  }

  // ── Select a suggestion ───────────────────────────────────────────────────
  function selectSuggestion(s: SearchSuggestion) {
    // `value` (backing state) = ticker symbol — this is what /api/analyze receives
    onChange(s.symbol);
    setSelectedSuggestion(s);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      // If dropdown is closed and Enter is pressed, let the form submit naturally
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault();
          selectSuggestion(suggestions[activeIndex]);
        }
        // If no item is highlighted, let the form submit naturally
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  // ── Form submit ───────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsOpen(false);
    if (!value.trim() || isLoading) return;

    // Auto-resolve: if we have suggestions and user didn't explicitly select one,
    // automatically use the top suggestion only if confidence is high (isBestMatch is true)
    if (suggestions.length > 0 && suggestions[0].isBestMatch) {
      const bestMatch = suggestions[0];
      onChange(bestMatch.symbol);
      setSelectedSuggestion(bestMatch);
      onAnalyze(bestMatch.symbol);
    } else {
      onAnalyze(value);
    }
  }

  // ── Display value ─────────────────────────────────────────────────────────
  // Shows "Apple Inc." when selected, or raw typed text otherwise.
  const displayValue = selectedSuggestion ? selectedSuggestion.name : value;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* ── Search input with autocomplete ─────────────────────────────── */}
        <div className="relative flex-1" ref={containerRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10 pointer-events-none" />

          <Input
            ref={inputRef}
            id="company-search-input"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Enter company name or ticker (e.g. Apple, MSFT)"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="pl-10 pr-8"
            aria-autocomplete="list"
            aria-controls="search-listbox"
            aria-activedescendant={
              activeIndex >= 0 ? `search-option-${activeIndex}` : undefined
            }
            aria-expanded={isOpen}
            role="combobox"
          />

          {/* Spinner for in-flight request */}
          {isFetching && (
            <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300" />
          )}

          {/* ── Dropdown ─────────────────────────────────────────────────── */}
          {isOpen && (
            <div
              id="search-listbox"
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <ul
                ref={listRef}
                className="max-h-[320px] overflow-y-auto overscroll-contain py-1"
                style={{ scrollbarWidth: "thin" }}
              >
                {isFetching && suggestions.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Searching...
                  </li>
                )}

                {!isFetching && suggestions.length === 0 && value.trim().length >= MIN_QUERY_LENGTH && (
                  <li className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No matching companies found.
                  </li>
                )}

                {suggestions.map((s, i) => {
                  const isFirst = i === 0;
                  const isBestMatchGroup = s.isBestMatch;
                  const showOtherMatchesHeader = i === 1 && suggestions[0].isBestMatch;

                  return (
                    <React.Fragment key={`${s.symbol}-${s.exchange}`}>
                      {/* Headers for Best Match vs Other Matches */}
                      {isFirst && isBestMatchGroup && (
                        <li className="px-3 pb-1 pt-2 text-[11px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400/90 flex items-center gap-1.5">
                          <span>⭐</span> Best Match
                        </li>
                      )}
                      {showOtherMatchesHeader && (
                        <li className="px-3 pb-1 pt-3 text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/50 mt-1">
                          Other Matches
                        </li>
                      )}

                      <li
                        id={`search-option-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectSuggestion(s);
                        }}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`group relative flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors
                          ${
                            i === activeIndex
                              ? "bg-zinc-50 dark:bg-zinc-900/60"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                          }`}
                      >
                        {/* Subtle left accent border for active/hover state */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 transition-opacity ${
                            i === activeIndex ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                          }`}
                        />

                        {/* Icon */}
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          <Building2 className="h-4.5 w-4.5" />
                        </span>

                        {/* Company info - Strictly left aligned */}
                        <div className="flex min-w-0 flex-1 flex-col text-left">
                          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {s.name}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                              {s.symbol}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span>{s.exchange}</span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span>{s.currency}</span>
                          </span>
                        </div>
                      </li>
                    </React.Fragment>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* ── Analyze button — completely unchanged ──────────────────────── */}
        <Button
          type="submit"
          size="lg"
          disabled={!value.trim() || isLoading}
          className="min-w-[140px]"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
