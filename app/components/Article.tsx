"use client";

import { useMemo, useState } from "react";

type ArticleProps = {
  title: string;
  year: number;
  source: string;
  summary: string;
  url?: string;
};

export default function Article({ title, year, source, summary, url }: ArticleProps) {
  const [expanded, setExpanded] = useState(false);
  const wordCount = useMemo(() => summary.split(/\s+/).filter(Boolean).length, [summary]);
  const isLong = wordCount > 120;

  return (
    <article className="article">
      <header className="article__header">
        <p className="article__eyebrow">{source}</p>
        <h2 className="article__title">{title}</h2>
        <p className="article__meta">{year}</p>
      </header>

      <div className="article__body">
        <p className={`article__summary ${expanded ? "is-expanded" : ""}`}>{summary}</p>
        {isLong ? (
          <button
            type="button"
            className="article__toggle"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show less" : "Continue reading"}
          </button>
        ) : null}
      </div>

      <footer className="article__footer">
        <span className="article__rule" aria-hidden />
        {url ? (
          <a className="article__link" href={url} target="_blank" rel="noreferrer">
            Source
          </a>
        ) : (
          <span className="article__note">Archive excerpt</span>
        )}
      </footer>
    </article>
  );
}
