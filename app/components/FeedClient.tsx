"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Article from "./Article";

type FeedArticle = {
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
  const initialVisible = 3;
  const [view, setView] = useState<ViewMode>("this-year");
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const currentYear = new Date().getFullYear();
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const randomized = useMemo(
    () => shuffle(articles),
    [articles, shuffleSeed]
  );
  const handleViewChange = (next: ViewMode) => {
    if (next === "random" || next === "by-decade") {
      setShuffleSeed(Math.random());
    }
    setView(next);
  };

  const filtered = useMemo(() => {
    if (view === "this-year") {
      const thisYear = randomized.filter((article) => article.year === currentYear);
      const rest = randomized.filter((article) => article.year !== currentYear);
      return thisYear.length > 0 ? [...thisYear, ...rest] : randomized;
    }

    if (view === "random") {
      return randomized;
    }

    return randomized;
  }, [currentYear, randomized, view]);

  const visibleArticles = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const byDecade = useMemo(() => {
    const groups: Record<string, FeedArticle[]> = {};
    visibleArticles.forEach((article) => {
      const decade = `${Math.floor(article.year / 10) * 10}s`;
      groups[decade] = groups[decade] || [];
      groups[decade].push(article);
    });

    return Object.entries(groups)
      .map(([decade, items]) => [decade, shuffle(items)] as const)
      .sort((a, b) => b[0].localeCompare(a[0]));
  }, [visibleArticles]);

  useEffect(() => {
    setVisibleCount(initialVisible);
  }, [view, randomized]);

  useEffect(() => {
    setShuffleSeed(Math.random());
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) {
          return;
        }
        setVisibleCount((prev) =>
          prev >= filtered.length ? prev : Math.min(prev + 1, filtered.length)
        );
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length]);

  return (
    <main className="feed">
      <div className="feed__controls">
        {Object.entries(viewLabels).map(([key, label]) => {
          const isActive = view === key;
          return (
            <button
              key={key}
              className={`feed__control ${isActive ? "is-active" : ""}`}
              type="button"
              onClick={() => handleViewChange(key as ViewMode)}
            >
              {label}
            </button>
          );
        })}
        {view === "random" ? (
          <span className="feed__control-info">Shuffle</span>
        ) : null}
      </div>

      {view === "by-decade"
        ? byDecade.flatMap(([decade, decadeArticles]) => [
            <section className="feed__item feed__decade" key={`${decade}-title`}>
              <div className="decade-card">
                <p className="decade-card__label">Edition</p>
                <h2 className="decade-card__title">{decade}</h2>
                <p className="decade-card__note">Swipe to browse stories</p>
              </div>
            </section>,
            ...decadeArticles.map((article) => (
              <section
                className="feed__item"
                key={`${decade}-${article.title}-${article.year}`}
              >
                <Article {...article} />
              </section>
            ))
          ])
        : visibleArticles.map((article) => (
            <section
              className="feed__item"
              key={`${article.title}-${article.year}`}
            >
              <Article {...article} />
            </section>
          ))}
      <div className="feed__sentinel" ref={sentinelRef} aria-hidden />
    </main>
  );
}
