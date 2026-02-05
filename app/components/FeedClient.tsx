"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Article from "./Article";

type FeedArticle = {
  id: string;
  title: string;
  year: number;
  source: string;
  summary: string;
  publishedAt?: string;
  url?: string;
};

type ViewMode = "this-year" | "random" | "by-decade";

const viewLabels: Record<ViewMode, string> = {
  "this-year": "This Year",
  random: "Random",
  "by-decade": "By Decade"
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function FeedClient({ articles }: { articles: FeedArticle[] }) {
  const initialVisible = 6;
  const batchSize = 3;
  const [view, setView] = useState<ViewMode>("this-year");
  const [seed, setSeed] = useState(0);
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const currentYear = new Date().getFullYear();

  const decades = useMemo(
    () =>
      Array.from(new Set(articles.map((article) => `${Math.floor(article.year / 10) * 10}s`))).sort(
        (a, b) => Number(b.slice(0, 4)) - Number(a.slice(0, 4))
      ),
    [articles]
  );

  useEffect(() => {
    if (decades.length > 0 && !selectedDecade) {
      setSelectedDecade(decades[0]);
    }
  }, [decades, selectedDecade]);

  const randomized = useMemo(() => shuffle(articles), [articles, seed]);

  const feed = useMemo(() => {
    if (view === "this-year") {
      const thisYear = randomized.filter((article) => article.year === currentYear);
      const rest = randomized.filter((article) => article.year !== currentYear);
      return [...thisYear, ...rest];
    }

    if (view === "by-decade" && selectedDecade) {
      const baseYear = Number(selectedDecade.slice(0, 4));
      return randomized.filter((article) => article.year >= baseYear && article.year <= baseYear + 9);
    }

    return randomized;
  }, [currentYear, randomized, selectedDecade, view]);

  const visibleArticles = useMemo(() => feed.slice(0, visibleCount), [feed, visibleCount]);

  useEffect(() => {
    setVisibleCount(initialVisible);
  }, [view, selectedDecade, seed]);

  const handleViewChange = (next: ViewMode) => {
    setView(next);
    setSeed(Math.random());
    if (next === "by-decade" && decades.length > 0) {
      const randomDecade = decades[Math.floor(Math.random() * decades.length)];
      setSelectedDecade(randomDecade);
    }
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }
        setVisibleCount((count) => Math.min(count + batchSize, feed.length));
      },
      { rootMargin: "220px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [feed.length]);

  return (
    <main className="feed">
      <header className="feed__header">
        <div className="feed__controls" role="tablist" aria-label="Feed Views">
          {Object.entries(viewLabels).map(([key, label]) => {
            const isActive = view === key;
            return (
              <button
                key={key}
                className={`feed__control ${isActive ? "is-active" : ""}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleViewChange(key as ViewMode)}
              >
                {label}
              </button>
            );
          })}
        </div>
        {view === "by-decade" ? (
          <div className="feed__decade-pills" aria-label="Choose decade">
            {decades.map((decade) => (
              <button
                key={decade}
                type="button"
                className={`feed__decade-pill ${selectedDecade === decade ? "is-active" : ""}`}
                onClick={() => {
                  setSelectedDecade(decade);
                  setSeed(Math.random());
                }}
              >
                {decade}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <section className="feed__list">
        {visibleArticles.map((article) => (
          <Article key={article.id} {...article} />
        ))}
      </section>

      <div className="feed__sentinel" ref={sentinelRef} aria-hidden />
    </main>
  );
}
